"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { sendMail, isEmailEnabled } from "@/lib/mailer";
import { getCurrentUser } from "@/lib/auth-helpers";
import { dbQuery } from "@/lib/db-proxy";

function redirectWithMessage(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams();
  params.set(type, message);
  redirect(`/?${params.toString()}`);
}

export async function requestPasswordReset(_prev: any, formData: FormData) {
  const email = (formData.get("email") ?? "").toString().toLowerCase().trim();
  if (!email) return { error: "Email required" };
  const [user] = await dbQuery<{ id: string; email: string }>(
    'SELECT "id", "email" FROM "User" WHERE "email" = $1 LIMIT 1',
    [email],
  );
  if (!user) return { success: "If that account exists, a reset link is ready." };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await dbQuery(
    'INSERT INTO "PasswordResetToken" ("token", "userId", "expiresAt") VALUES ($1, $2, $3)',
    [token, user.id, expiresAt.toISOString()],
  );

  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password/${token}`;
  if (isEmailEnabled() && baseUrl) {
    await sendMail({
      to: user.email,
      subject: "Reset your password",
      text: `Reset your password: ${resetUrl}`,
      html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    }).catch((err) => console.error("Password reset email failed", err));
  }
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category", "channel", "link") VALUES ($1, $2, $3, $4, $5, $6)',
    [user.id, "PASSWORD_RESET_REQUEST", "Password reset requested", "security", isEmailEnabled() ? "email" : "in-app", resetUrl],
  );

  return {
    success: isEmailEnabled() ? "Password reset link emailed if the account exists." : "Password reset link generated.",
    link: resetUrl,
  };
}

export async function resetPassword(_prev: any, formData: FormData) {
  const token = (formData.get("token") ?? "").toString().trim();
  const newPassword = (formData.get("newPassword") ?? "").toString();
  if (!token || !newPassword) return { error: "Missing token or password" };

  const [record] = await dbQuery<{ token: string; userId: string; expiresAt: string; used: boolean }>(
    'SELECT "token", "userId", "expiresAt", "used" FROM "PasswordResetToken" WHERE "token" = $1 LIMIT 1',
    [token],
  );
  if (!record || record.used || new Date(record.expiresAt) < new Date()) {
    return { error: "Invalid or expired token" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await dbQuery('UPDATE "User" SET "passwordHash" = $1, "updatedAt" = now() WHERE "id" = $2', [
    passwordHash,
    record.userId,
  ]);
  await dbQuery('UPDATE "PasswordResetToken" SET "used" = true WHERE "token" = $1', [token]);
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [record.userId, "PASSWORD_RESET", "Password reset via token", "security"],
  );

  return { success: "Password updated. You can sign in now." };
}

export async function sendVerificationLink() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await dbQuery(
    'INSERT INTO "EmailVerificationToken" ("token", "userId", "expiresAt") VALUES ($1, $2, $3)',
    [token, user.id, expiresAt.toISOString()],
  );
  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "";
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${token}`;
  if (isEmailEnabled() && baseUrl) {
    await sendMail({
      to: user.email ?? "",
      subject: "Verify your email",
      text: `Click to verify: ${verifyUrl}`,
      html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    }).catch((err) => console.error("Verification email failed", err));
  }
  return { success: isEmailEnabled() ? "Verification email sent." : "Verification link generated.", link: verifyUrl };
}

export async function verifyEmailToken(token: string) {
  const [record] = await dbQuery<{ token: string; userId: string; expiresAt: string; used: boolean }>(
    'SELECT "token", "userId", "expiresAt", "used" FROM "EmailVerificationToken" WHERE "token" = $1 LIMIT 1',
    [token],
  );
  if (!record || record.used || new Date(record.expiresAt) < new Date()) {
    return { success: false, message: "Invalid or expired verification link." };
  }
  await dbQuery('UPDATE "User" SET "emailVerified" = now(), "updatedAt" = now() WHERE "id" = $1', [record.userId]);
  await dbQuery('UPDATE "EmailVerificationToken" SET "used" = true WHERE "token" = $1', [token]);
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [record.userId, "EMAIL_VERIFIED", "Email verified", "account"],
  );
  return { success: true, message: "Email verified." };
}

export async function regenerateRecoveryCodes() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const codes = Array.from({ length: 10 }, () => randomUUID().slice(0, 8).toUpperCase());
  await dbQuery('DELETE FROM "RecoveryCode" WHERE "userId" = $1', [user.id]);
  const params: unknown[] = [];
  const values = codes
    .map((code, idx) => {
      const userParam = idx * 2 + 1;
      const codeParam = idx * 2 + 2;
      params.push(user.id, code);
      return `($${userParam}, $${codeParam})`;
    })
    .join(", ");
  if (values) {
    await dbQuery(`INSERT INTO "RecoveryCode" ("userId", "code") VALUES ${values}`, params);
  }
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "2FA_RECOVERY_REGEN", "Recovery codes regenerated", "security"],
  );
  return { codes };
}

export async function signOutAllSessions() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await dbQuery('UPDATE "Session" SET "revoked" = true, "revokedAt" = now() WHERE "userId" = $1', [user.id]);
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "SESSIONS_REVOKED", "Signed out of all sessions", "security"],
  );
  redirect("/login");
}
