"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Buffer } from "node:buffer";
import { authenticator } from "otplib";
import { getCurrentUser } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";
import { sendMail, isEmailEnabled } from "@/lib/mailer";
import { dbQuery } from "@/lib/db-proxy";

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

async function logSecurityEvent(options: {
  userId: string;
  eventType: string;
  detail?: string | null;
  category?: string | null;
  channel?: string | null;
  link?: string | null;
}) {
  const id = randomUUID();
  const { userId, eventType, detail = null, category = null, channel = null, link = null } = options;
  await dbQuery(
    [
      'INSERT INTO "SecurityEvent" ("id", "userId", "eventType", "detail", "category", "channel", "link")',
      "VALUES ($1, $2, $3, $4, $5, $6, $7)",
    ].join(" "),
    [id, userId, eventType, detail, category, channel, link],
  );
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

  const displayName = (formData.get("displayName") ?? "").toString().trim() || null;
  const bannerUrl = (formData.get("bannerUrl") ?? "").toString().trim() || null;
  const handle = (formData.get("handle") ?? "").toString().trim() || null;
  const bio = (formData.get("bio") ?? "").toString().trim() || null;
  const locale = (formData.get("locale") ?? "").toString().trim() || "en-US";
  const timeZone = (formData.get("timeZone") ?? "").toString().trim() || "UTC";
  const theme = (formData.get("theme") ?? "system").toString();
  const notificationEmailOptIn = formData.get("notificationEmailOptIn") === "on";
  const notificationPushOptIn = formData.get("notificationPushOptIn") === "on";
  const notificationInAppOptIn = formData.get("notificationInAppOptIn") === "on";

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const add = (clause: string, value: unknown) => {
    sets.push(clause.replace("?", `$${idx}`));
    params.push(value);
    idx += 1;
  };

  if (displayName !== undefined) add('"displayName" = ?', displayName);
  if (avatarUrl !== undefined) add('"avatarUrl" = ?', avatarUrl);
  if (bannerUrl !== undefined) add('"bannerUrl" = ?', bannerUrl);
  if (handle !== undefined) add('"handle" = ?', handle);
  if (bio !== undefined) add('"bio" = ?', bio);
  if (locale) add('"locale" = ?', locale);
  if (timeZone) add('"timeZone" = ?', timeZone);
  if (theme) add('"theme" = ?', theme);
  add('"notificationEmailOptIn" = ?', notificationEmailOptIn);
  add('"notificationPushOptIn" = ?', notificationPushOptIn);
  add('"notificationInAppOptIn" = ?', notificationInAppOptIn);
  sets.push('"updatedAt" = now()');

  params.push(user.id);

  await dbQuery(
    `UPDATE "User" SET ${sets.join(", ")} WHERE "id" = $${idx}`,
    params,
  );
  await logSecurityEvent({
    userId: user.id,
    eventType: "PROFILE_UPDATED",
    detail: "Profile or preferences updated",
    category: "account",
    channel: "in-app",
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

  const [record] = await dbQuery<{ passwordHash: string }>(
    'SELECT "passwordHash" FROM "User" WHERE "id" = $1 LIMIT 1',
    [user.id],
  );
  if (!record) redirect("/login");

  const valid = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!valid) {
    redirectWithMessage("Current password is incorrect", "error");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await dbQuery('UPDATE "User" SET "passwordHash" = $1, "updatedAt" = now() WHERE "id" = $2', [
    passwordHash,
    user.id,
  ]);
  await logSecurityEvent({
    userId: user.id,
    eventType: "PASSWORD_CHANGED",
    detail: "Password updated",
    category: "security",
  });
  revalidatePath("/settings");
  redirectWithMessage("Password updated");
}

export async function toggleLoginAlerts(formData: FormData) {
  const user = await requireActiveUser();
  const enabled = formData.get("loginAlerts") === "on";
  await dbQuery('UPDATE "User" SET "loginAlerts" = $1, "updatedAt" = now() WHERE "id" = $2', [enabled, user.id]);
  await logSecurityEvent({
    userId: user.id,
    eventType: "LOGIN_ALERTS",
    detail: enabled ? "Login alerts enabled" : "Login alerts disabled",
    category: "account",
  });
  revalidatePath("/settings");
  redirectWithMessage("Login alerts updated");
}

export async function generateTwoFactor() {
  const user = await requireActiveUser();
  const secret = authenticator.generateSecret();
  await dbQuery(
    'UPDATE "User" SET "twoFactorSecret" = $1, "twoFactorEnabled" = false, "updatedAt" = now() WHERE "id" = $2',
    [secret, user.id],
  );
  await logSecurityEvent({
    userId: user.id,
    eventType: "2FA_SECRET",
    detail: "2FA secret generated",
    category: "security",
  });
  revalidatePath("/settings");
  redirectWithMessage("2FA secret generated. Scan the new code.");
}

export async function verifyTwoFactor(formData: FormData) {
  const user = await requireActiveUser();
  const code = (formData.get("code") ?? "").toString().trim();
  const [record] = await dbQuery<{ twoFactorSecret: string | null }>(
    'SELECT "twoFactorSecret" FROM "User" WHERE "id" = $1 LIMIT 1',
    [user.id],
  );
  if (!record?.twoFactorSecret) {
    redirectWithMessage("No 2FA secret to verify", "error");
  }
  const ok = authenticator.verify({ token: code, secret: (record?.twoFactorSecret ?? "") as string });
  if (!ok) {
    redirectWithMessage("Invalid 2FA code", "error");
  }
  await dbQuery('UPDATE "User" SET "twoFactorEnabled" = true, "updatedAt" = now() WHERE "id" = $1', [user.id]);
  await logSecurityEvent({
    userId: user.id,
    eventType: "2FA_ENABLED",
    detail: "2FA enabled",
    category: "security",
  });
  await regenerateRecoveryCodes();
  revalidatePath("/settings");
  redirectWithMessage("2FA enabled");
}

export async function disableTwoFactor() {
  const user = await requireActiveUser();
  await dbQuery(
    'UPDATE "User" SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL, "updatedAt" = now() WHERE "id" = $1',
    [user.id],
  );
  await logSecurityEvent({
    userId: user.id,
    eventType: "2FA_DISABLED",
    detail: "2FA disabled",
    category: "security",
  });
  revalidatePath("/settings");
  redirectWithMessage("2FA disabled");
}

export async function revokeSession(formData: FormData) {
  const user = await requireActiveUser();
  const sessionToken = (formData.get("sessionToken") ?? "").toString();
  if (!sessionToken) redirectWithMessage("Missing session token", "error");
  await dbQuery('UPDATE "Session" SET "revoked" = true, "revokedAt" = now() WHERE "sessionToken" = $1 AND "userId" = $2', [
    sessionToken,
    user.id,
  ]);
  await logSecurityEvent({
    userId: user.id,
    eventType: "SESSION_REVOKED",
    detail: `Session revoked ${sessionToken}`,
    category: "security",
  });
  revalidatePath("/settings");
  redirectWithMessage("Session revoked");
}

export async function revokeAllSessions() {
  const user = await requireActiveUser();
  await dbQuery('UPDATE "Session" SET "revoked" = true, "revokedAt" = now() WHERE "userId" = $1', [user.id]);
  await logSecurityEvent({
    userId: user.id,
    eventType: "SESSIONS_REVOKED",
    detail: "All sessions revoked",
    category: "security",
  });
  revalidatePath("/settings");
  redirectWithMessage("All sessions revoked");
}

export async function regenerateRecoveryCodes() {
  const user = await requireActiveUser();
  const codes = Array.from({ length: 10 }, () => ({ id: randomUUID(), code: randomUUID().slice(0, 8).toUpperCase() }));
  await dbQuery('DELETE FROM "RecoveryCode" WHERE "userId" = $1', [user.id]);
  const params: unknown[] = [];
  const values = codes
    .map((code, idx) => {
      const idParam = idx * 3 + 1;
      const userParam = idx * 3 + 2;
      const codeParam = idx * 3 + 3;
      params.push(code.id, user.id, code.code);
      return `($${idParam}, $${userParam}, $${codeParam})`;
    })
    .join(", ");
  if (values) {
    await dbQuery(`INSERT INTO "RecoveryCode" ("id", "userId", "code") VALUES ${values}`, params);
  }
  await logSecurityEvent({
    userId: user.id,
    eventType: "2FA_RECOVERY_REGEN",
    detail: "Recovery codes regenerated",
    category: "security",
  });
  revalidatePath("/settings");
  redirectWithMessage("Recovery codes regenerated");
}

export async function generateVerificationLink() {
  const user = await requireActiveUser();
  const id = randomUUID();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await dbQuery(
    'INSERT INTO "EmailVerificationToken" ("id", "token", "userId", "expiresAt") VALUES ($1, $2, $3, $4)',
    [id, token, user.id, expiresAt.toISOString()],
  );
  await logSecurityEvent({
    userId: user.id,
    eventType: "EMAIL_VERIFY_LINK",
    detail: "Verification link generated",
    category: "account",
    channel: "email",
    link: `/verify-email?token=${token}`,
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
  await dbQuery(
    'UPDATE "User" SET "notificationEmailOptIn" = $1, "notificationPushOptIn" = $2, "notificationInAppOptIn" = $3, "updatedAt" = now() WHERE "id" = $4',
    [email, push, inApp, user.id],
  );
  await logSecurityEvent({
    userId: user.id,
    eventType: "NOTIFICATION_PREFS",
    detail: `Prefs updated (email:${email ? "on" : "off"}, push:${push ? "on" : "off"}, in-app:${inApp ? "on" : "off"})`,
    category: "account",
  });
  revalidatePath("/settings");
  redirectWithMessage("Notification preferences updated");
}
