"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";
import { uploadAvatar } from "@/lib/uploads";
import { captureClientMetadata } from "@/lib/security-events";

function redirectWithMessage(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams();
  params.set(type, message);
  redirect(`/settings?${params.toString()}`);
}

function isRedirectError(error: unknown): error is { digest: string } {
  return typeof error === "object" && error !== null && typeof (error as any).digest === "string";
}

async function requireActiveUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.status !== "ACTIVE") {
    redirect("/login?message=inactive");
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
  if (!dbUser) {
    redirect("/login");
  }
  return user;
}

export async function updateProfile(formData: FormData) {
  const user = await requireActiveUser();
  const meta = await captureClientMetadata();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: (formData.get("displayName") ?? "").toString().trim() || null,
      bio: (formData.get("bio") ?? "").toString().trim() || null,
      locale: (formData.get("locale") ?? "").toString().trim() || "en-US",
      timeZone: (formData.get("timeZone") ?? "").toString().trim() || "UTC",
      theme: (formData.get("theme") ?? "system").toString(),
    },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "PROFILE_UPDATED",
      detail: "Profile updated",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  revalidatePath("/settings");
  redirectWithMessage("Profile updated");
}

export async function updateAvatar(formData: FormData) {
  const user = await requireActiveUser();
  const meta = await captureClientMetadata();
  const fileEntry = formData.get("avatar");
  if (!(fileEntry instanceof File)) {
    redirectWithMessage("No file provided", "error");
  }
  const file = fileEntry as File;
  if (file.size === 0) {
    redirectWithMessage("No file provided", "error");
  }
  const maxSizeBytes = 8 * 1024 * 1024; // match next.config.ts serverActions limit
  if (file.size > maxSizeBytes) {
    redirectWithMessage("Avatar must be 8MB or smaller", "error");
  }
  try {
    const stored = await uploadAvatar(user.id, file);
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: stored.url },
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "AVATAR_UPDATED",
        detail: "Avatar updated",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    revalidatePath("/settings");
    redirectWithMessage("Avatar updated");
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("updateAvatar error", err);
    redirectWithMessage("Avatar upload failed", "error");
  }
}

export async function changePassword(formData: FormData) {
  const user = await requireActiveUser();
  const currentPassword = (formData.get("currentPassword") ?? "").toString();
  const newPassword = (formData.get("newPassword") ?? "").toString();

  if (!currentPassword || !newPassword) {
    redirectWithMessage("Missing password fields", "error");
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) redirect("/login");

  const valid = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!valid) {
    redirectWithMessage("Current password is incorrect", "error");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const meta = await captureClientMetadata();
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "PASSWORD_CHANGED",
        detail: "Password updated from settings",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    }),
  ]);
  revalidatePath("/settings");
  redirectWithMessage("Password updated");
}

export async function toggleLoginAlerts(formData: FormData) {
  const user = await requireActiveUser();
  const enabled = formData.get("loginAlerts") === "on";
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAlerts: enabled },
  });
  revalidatePath("/settings");
  redirectWithMessage("Login alerts updated");
}

export async function generateTwoFactor() {
  const user = await requireActiveUser();
  const secret = authenticator.generateSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });
  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "2FA_SECRET", detail: "2FA secret generated" },
  });
  revalidatePath("/settings");
  redirectWithMessage("2FA secret generated. Scan the new code.");
}

export async function verifyTwoFactor(formData: FormData) {
  const user = await requireActiveUser();
  const code = (formData.get("code") ?? "").toString().trim();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true },
  });
  if (!record?.twoFactorSecret) {
    redirectWithMessage("No 2FA secret to verify", "error");
  }
  const ok = authenticator.verify({ token: code, secret: (record?.twoFactorSecret ?? "") as string });
  if (!ok) {
    redirectWithMessage("Invalid 2FA code", "error");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });
  const meta = await captureClientMetadata();
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "2FA_ENABLED",
      detail: "2FA enabled",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  await regenerateRecoveryCodes();
  revalidatePath("/settings");
  redirectWithMessage("2FA enabled");
}

export async function disableTwoFactor() {
  const user = await requireActiveUser();
  const meta = await captureClientMetadata();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    }),
    prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "2FA_DISABLED",
        detail: "2FA disabled",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    }),
  ]);
  revalidatePath("/settings");
  redirectWithMessage("2FA disabled");
}

export async function revokeSession(formData: FormData) {
  const user = await requireActiveUser();
  const meta = await captureClientMetadata();
  const jti = (formData.get("sessionId") ?? "").toString();
  if (!jti) redirectWithMessage("Missing session id", "error");
  await prisma.session.updateMany({
    where: { jti, userId: user.id },
    data: { revoked: true, revokedAt: new Date() },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "SESSION_REVOKED",
      detail: `Session revoked ${jti}`,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  revalidatePath("/settings");
  redirectWithMessage("Session revoked");
}

export async function revokeAllSessions() {
  const user = await requireActiveUser();
  const meta = await captureClientMetadata();
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { revoked: true, revokedAt: new Date() },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "SESSIONS_REVOKED",
      detail: "All sessions revoked",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  revalidatePath("/settings");
  redirectWithMessage("All sessions revoked");
}

export async function regenerateRecoveryCodes() {
  const user = await requireActiveUser();
  const codes = Array.from({ length: 10 }, () => randomUUID().slice(0, 8).toUpperCase());
  const meta = await captureClientMetadata();
  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId: user.id } }),
    prisma.recoveryCode.createMany({
      data: codes.map((code) => ({ userId: user.id, code })),
    }),
    prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "2FA_RECOVERY_REGEN",
        detail: "Recovery codes regenerated",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    }),
  ]);
  revalidatePath("/settings");
  redirectWithMessage("Recovery codes regenerated");
}

export async function generateVerificationLink() {
  const user = await requireActiveUser();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt },
  });
  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "EMAIL_VERIFY_LINK", detail: "Verification link generated" },
  });
  return { success: "Verification link generated", link: `/verify-email?token=${token}` };
}
