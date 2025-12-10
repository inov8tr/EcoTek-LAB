import { redirect } from "next/navigation";
import type { Route } from "next";
import { headers } from "next/headers";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
  status: UserStatus;
  displayName?: string | null;
  avatarUrl?: string | null;
  pronouns?: string | null;
  bio?: string | null;
  locale?: string | null;
  timeZone?: string | null;
  theme?: string | null;
  loginAlerts?: boolean;
  twoFactorEnabled?: boolean;
  sessionId?: string | null;
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
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      avatarUrl: true,
      pronouns: true,
      bio: true,
      locale: true,
      timeZone: true,
      theme: true,
      loginAlerts: true,
      twoFactorEnabled: true,
      role: true,
      status: true,
    },
  });
  if (!dbUser) {
    redirect("/login" as Route);
  }
  if (dbUser.status !== status) {
    const loginUrl = `/login?message=${dbUser.status.toLowerCase()}`;
    redirect(loginUrl as never);
  }
  return { ...user, ...dbUser };
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
  await prisma.session.update({
    where: { jti: sessionId },
    data: { lastSeenAt: new Date(), userAgent: ua, ipAddress: ip },
  });
}
