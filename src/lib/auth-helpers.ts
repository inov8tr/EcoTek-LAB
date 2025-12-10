import { redirect } from "next/navigation";
import type { Route } from "next";
import { headers } from "next/headers";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { sendMail, isEmailEnabled } from "@/lib/mailer";
import { describeUserAgent } from "@/lib/utils";
import { recordEvent } from "@/lib/events";

export type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
  status: UserStatus;
  displayName?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  handle?: string | null;
  pronouns?: string | null;
  bio?: string | null;
  locale?: string | null;
  timeZone?: string | null;
  theme?: string | null;
  loginAlerts?: boolean;
  twoFactorEnabled?: boolean;
  sessionId?: string | null;
  notificationEmailOptIn?: boolean | null;
  notificationPushOptIn?: boolean | null;
  notificationInAppOptIn?: boolean | null;
  unreadNotifications?: number;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as CurrentUser;
}

export async function requireStatus(status: UserStatus) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login" as Route);
  }
  await enforceSession(user);
  if (user.status !== status) {
    const loginUrl = `/login?message=${user.status.toLowerCase()}`;
    redirect(loginUrl as never);
  }
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login" as Route);
  }
  await enforceSession(user);
  if (!roles.includes(user.role)) {
    redirect("/dashboard" as Route);
  }
  return user;
}

async function enforceSession(user: CurrentUser) {
  const sessionId = user.sessionId;
  if (!sessionId) return;
  const session = await prisma.session.findUnique({ where: { jti: sessionId } });
  if (!session || session.revoked) {
    await signOut({ redirectTo: "/login" });
    redirect("/login" as Route);
  }
  const hdrs = await headers();
  const ua = hdrs.get("user-agent") ?? session.userAgent ?? null;
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? session.ipAddress ?? null;
  if (!session.loginNotified && user.loginAlerts) {
    await recordEvent({
      userId: user.id,
      eventType: "LOGIN_ALERT",
      detail: describeUserAgent(ua),
      ipAddress: ip,
      userAgent: ua,
      category: "security",
      channel: isEmailEnabled() ? "email" : "in-app",
    });
    if (isEmailEnabled() && user.email) {
      const body = `New sign-in detected.\n\nIP: ${ip ?? "unknown"}\nDevice: ${describeUserAgent(ua)}\nTime: ${new Date().toISOString()}`;
      await sendMail({
        to: user.email,
        subject: "New login detected",
        text: body,
      }).catch((err) => console.error("Login alert email failed", err));
    }
  }
  await prisma.session.update({
    where: { jti: sessionId },
    data: { lastSeenAt: new Date(), userAgent: ua, ipAddress: ip, loginNotified: true },
  });
}
