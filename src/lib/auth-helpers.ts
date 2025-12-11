import { redirect } from "next/navigation";
import type { Route } from "next";
import { auth } from "@/auth";
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
  bannerUrl?: string | null;
  handle?: string | null;
  pronouns?: string | null;
  bio?: string | null;
  locale?: string | null;
  timeZone?: string | null;
  theme?: string | null;
  loginAlerts?: boolean;
  twoFactorEnabled?: boolean;
  notificationEmailOptIn?: boolean | null;
  notificationPushOptIn?: boolean | null;
  notificationInAppOptIn?: boolean | null;
  unreadNotifications?: number;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      displayName: true,
      avatarUrl: true,
      bannerUrl: true,
      handle: true,
      pronouns: true,
      bio: true,
      locale: true,
      timeZone: true,
      theme: true,
      loginAlerts: true,
      twoFactorEnabled: true,
      notificationEmailOptIn: true,
      notificationPushOptIn: true,
      notificationInAppOptIn: true,
    },
  });

  if (!dbUser) return null;

  return { ...dbUser };
}

export async function requireStatus(status: UserStatus) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login" as Route);
  }
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
  if (!roles.includes(user.role)) {
    redirect("/dashboard" as Route);
  }
  return user;
}
