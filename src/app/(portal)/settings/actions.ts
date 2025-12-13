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

  await dbQuery(
    [
      'UPDATE "User" SET "displayName" = $1, "avatarUrl" = $2, "bannerUrl" = $3, "handle" = $4, "bio" = $5,',
      '"locale" = $6, "timeZone" = $7, "theme" = $8, "notificationEmailOptIn" = $9,',
      '"notificationPushOptIn" = $10, "notificationInAppOptIn" = $11, "updatedAt" = now() WHERE "id" = $12',
    ].join(" "),
    [
      displayName,
      avatarUrl,
      bannerUrl,
      handle,
      bio,
      locale,
      timeZone,
      theme,
      notificationEmailOptIn,
      notificationPushOptIn,
      notificationInAppOptIn,
      user.id,
    ],
  );
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category", "channel") VALUES ($1, $2, $3, $4, $5)',
    [user.id, "PROFILE_UPDATED", "Profile or preferences updated", "account", "in-app"],
  );
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
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "PASSWORD_CHANGED", "Password updated", "security"],
  );
  revalidatePath("/settings");
  redirectWithMessage("Password updated");
}

export async function toggleLoginAlerts(formData: FormData) {
  const user = await requireActiveUser();
  const enabled = formData.get("loginAlerts") === "on";
  await dbQuery('UPDATE "User" SET "loginAlerts" = $1, "updatedAt" = now() WHERE "id" = $2', [enabled, user.id]);
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "LOGIN_ALERTS", enabled ? "Login alerts enabled" : "Login alerts disabled", "account"],
  );
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
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "2FA_SECRET", "2FA secret generated", "security"],
  );
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
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "2FA_ENABLED", "2FA enabled", "security"],
  );
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
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "2FA_DISABLED", "2FA disabled", "security"],
  );
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
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "SESSION_REVOKED", `Session revoked ${sessionToken}`, "security"],
  );
  revalidatePath("/settings");
  redirectWithMessage("Session revoked");
}

export async function revokeAllSessions() {
  const user = await requireActiveUser();
  await dbQuery('UPDATE "Session" SET "revoked" = true, "revokedAt" = now() WHERE "userId" = $1', [user.id]);
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [user.id, "SESSIONS_REVOKED", "All sessions revoked", "security"],
  );
  revalidatePath("/settings");
  redirectWithMessage("All sessions revoked");
}

export async function regenerateRecoveryCodes() {
  const user = await requireActiveUser();
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
  revalidatePath("/settings");
  redirectWithMessage("Recovery codes regenerated");
}

export async function generateVerificationLink() {
  const user = await requireActiveUser();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await dbQuery(
    'INSERT INTO "EmailVerificationToken" ("token", "userId", "expiresAt") VALUES ($1, $2, $3)',
    [token, user.id, expiresAt.toISOString()],
  );
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category", "channel", "link") VALUES ($1, $2, $3, $4, $5, $6)',
    [user.id, "EMAIL_VERIFY_LINK", "Verification link generated", "account", "email", `/verify-email?token=${token}`],
  );
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
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "category") VALUES ($1, $2, $3, $4)',
    [
      user.id,
      "NOTIFICATION_PREFS",
      `Prefs updated (email:${email ? "on" : "off"}, push:${push ? "on" : "off"}, in-app:${inApp ? "on" : "off"})`,
      "account",
    ],
  );
  revalidatePath("/settings");
  redirectWithMessage("Notification preferences updated");
}
