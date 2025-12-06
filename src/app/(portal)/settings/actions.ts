"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

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
  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: (formData.get("displayName") ?? "").toString().trim() || null,
      avatarUrl: (formData.get("avatarUrl") ?? "").toString().trim() || null,
      pronouns: (formData.get("pronouns") ?? "").toString().trim() || null,
      bio: (formData.get("bio") ?? "").toString().trim() || null,
      locale: (formData.get("locale") ?? "").toString().trim() || "en-US",
      timeZone: (formData.get("timeZone") ?? "").toString().trim() || "UTC",
      theme: (formData.get("theme") ?? "system").toString(),
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
  revalidatePath("/settings");
  redirectWithMessage("2FA enabled");
}

export async function disableTwoFactor() {
  const user = await requireActiveUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  revalidatePath("/settings");
  redirectWithMessage("2FA disabled");
}

export async function revokeSession(formData: FormData) {
  const user = await requireActiveUser();
  const jti = (formData.get("sessionId") ?? "").toString();
  if (!jti) redirectWithMessage("Missing session id", "error");
  await prisma.session.updateMany({
    where: { jti, userId: user.id },
    data: { revoked: true, revokedAt: new Date() },
  });
  revalidatePath("/settings");
  redirectWithMessage("Session revoked");
}
