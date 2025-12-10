"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { captureClientMetadata } from "@/lib/security-events";

function redirectWithMessage(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams();
  params.set(type, message);
  redirect(`/?${params.toString()}`);
}

export async function requestPasswordReset(
  _prev: { error?: string; success?: string },
  formData: FormData,
) {
  const email = (formData.get("email") ?? "").toString().toLowerCase().trim();
  if (!email) return { error: "Email required" };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: "If that account exists, a reset link is ready." };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  const meta = await captureClientMetadata();
  await prisma.$transaction([
    prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    }),
    prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "PASSWORD_RESET_REQUEST",
        detail: "Password reset link requested",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    }),
  ]);

  const link = `/reset-password?token=${token}`;
  if (process.env.NODE_ENV !== "production") {
    console.info(`[PasswordResetLink] ${link}`);
  }

  return {
    success: "Password reset link generated. Check your email.",
  };
}

export async function resetPassword(_prev: any, formData: FormData) {
  const token = (formData.get("token") ?? "").toString().trim();
  const newPassword = (formData.get("newPassword") ?? "").toString();
  if (!token || !newPassword) return { error: "Missing token or password" };

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return { error: "Invalid or expired token" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const meta = await captureClientMetadata();
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
    prisma.securityEvent.create({
      data: {
        userId: record.userId,
        eventType: "PASSWORD_RESET",
        detail: "Password reset via token",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    }),
  ]);

  return { success: "Password updated. You can sign in now." };
}

export async function sendVerificationLink() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt },
  });
  return { success: "Verification link generated.", link: `/verify-email?token=${token}` };
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return { success: false, message: "Invalid or expired verification link." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.update({ where: { token }, data: { used: true } }),
    prisma.securityEvent.create({
      data: { userId: record.userId, eventType: "EMAIL_VERIFIED", detail: "Email verified" },
    }),
  ]);
  return { success: true, message: "Email verified." };
}

export async function regenerateRecoveryCodes() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const codes = Array.from({ length: 10 }, () => randomUUID().slice(0, 8).toUpperCase());
  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId: user.id } }),
    prisma.recoveryCode.createMany({
      data: codes.map((code) => ({ userId: user.id, code })),
    }),
    prisma.securityEvent.create({
      data: { userId: user.id, eventType: "2FA_RECOVERY_REGEN", detail: "Recovery codes regenerated" },
    }),
  ]);
  return { codes };
}

export async function signOutAllSessions() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const meta = await captureClientMetadata();
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { revoked: true, revokedAt: new Date() },
  });
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "SESSIONS_REVOKED",
      detail: "Signed out of all sessions",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  redirect("/login");
}
