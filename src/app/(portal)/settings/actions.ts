"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Buffer } from "node:buffer";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";
import { sendMail, isEmailEnabled } from "@/lib/mailer";

function redirectWithMessage(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams();
  params.set(type, message);
  redirect(`/settings?${params.toString()}`);
}

async function requireActiveUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.status !== "ACTIVE") {
    redirect("/login?message=inactive");
  }
  return user;
}

export async function updateProfile(formData: FormData) {
  const user = await requireActiveUser();
  const avatarFile = formData.get("avatarFile");
  let avatarUrl = (formData.get("currentAvatarUrl") ?? "").toString().trim() || null;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const bytes = await avatarFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mime = avatarFile.type || "image/png";
    avatarUrl = `data:${mime};base64,${base64}`;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: (formData.get("displayName") ?? "").toString().trim() || null,
      avatarUrl,
      bannerUrl: (formData.get("bannerUrl") ?? "").toString().trim() || null,
      handle: (formData.get("handle") ?? "").toString().trim() || null,
      bio: (formData.get("bio") ?? "").toString().trim() || null,
      locale: (formData.get("locale") ?? "").toString().trim() || "en-US",
      timeZone: (formData.get("timeZone") ?? "").toString().trim() || "UTC",
      theme: (formData.get("theme") ?? "system").toString(),
      notificationEmailOptIn: formData.get("notificationEmailOptIn") === "on",
      notificationPushOptIn: formData.get("notificationPushOptIn") === "on",
      notificationInAppOptIn: formData.get("notificationInAppOptIn") === "on",
    },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "PROFILE_UPDATED",
      detail: "Profile or preferences updated",
      category: "account",
      channel: "in-app",
    },
  });
  revalidatePath("/settings");
  redirectWithMessage("Profile updated");
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
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "PASSWORD_CHANGED", detail: "Password updated", category: "security" },
  });
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
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "LOGIN_ALERTS",
      detail: enabled ? "Login alerts enabled" : "Login alerts disabled",
      category: "account",
    },
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
    data: { userId: user.id, eventType: "2FA_SECRET", detail: "2FA secret generated", category: "security" },
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
  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "2FA_ENABLED", detail: "2FA enabled", category: "security" },
  });
  await regenerateRecoveryCodes();
  revalidatePath("/settings");
  redirectWithMessage("2FA enabled");
}

export async function disableTwoFactor() {
  const user = await requireActiveUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "2FA_DISABLED", detail: "2FA disabled", category: "security" },
  });
  revalidatePath("/settings");
  redirectWithMessage("2FA disabled");
}

export async function revokeSession(formData: FormData) {
  const user = await requireActiveUser();
  const sessionToken = (formData.get("sessionToken") ?? "").toString();
  if (!sessionToken) redirectWithMessage("Missing session token", "error");
  await prisma.session.updateMany({
    where: { sessionToken, userId: user.id },
    data: { revoked: true, revokedAt: new Date() },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "SESSION_REVOKED",
      detail: `Session revoked ${sessionToken}`,
      category: "security",
    },
  });
  revalidatePath("/settings");
  redirectWithMessage("Session revoked");
}

export async function revokeAllSessions() {
  const user = await requireActiveUser();
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { revoked: true, revokedAt: new Date() },
  });
  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "SESSIONS_REVOKED", detail: "All sessions revoked", category: "security" },
  });
  revalidatePath("/settings");
  redirectWithMessage("All sessions revoked");
}

export async function regenerateRecoveryCodes() {
  const user = await requireActiveUser();
  const codes = Array.from({ length: 10 }, () => randomUUID().slice(0, 8).toUpperCase());
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
        category: "security",
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
    data: {
      userId: user.id,
      eventType: "EMAIL_VERIFY_LINK",
      detail: "Verification link generated",
      category: "account",
      channel: "email",
      link: `/verify-email?token=${token}`,
    },
  });
  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "";
  if (isEmailEnabled() && baseUrl) {
    const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${token}`;
    await sendMail({
      to: user.email ?? "",
      subject: "Verify your email",
      text: `Click to verify: ${verifyUrl}`,
      html: `<p>Click to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    }).catch((err) => console.error("Email send failed", err));
  }
  revalidatePath("/settings");
  redirectWithMessage("Verification link generated");
}

export async function updateNotificationPrefs(formData: FormData) {
  const user = await requireActiveUser();
  const email = formData.get("notificationEmailOptIn") === "on";
  const push = formData.get("notificationPushOptIn") === "on";
  const inApp = formData.get("notificationInAppOptIn") === "on";
  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationEmailOptIn: email,
      notificationPushOptIn: push,
      notificationInAppOptIn: inApp,
    },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "NOTIFICATION_PREFS",
      detail: `Prefs updated (email:${email ? "on" : "off"}, push:${push ? "on" : "off"}, in-app:${inApp ? "on" : "off"})`,
      category: "account",
    },
  });
  revalidatePath("/settings");
  redirectWithMessage("Notification preferences updated");
}
