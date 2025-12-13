import { redirect } from "next/navigation";
import type { Route } from "next";
import { auth } from "@/auth";
import { dbQuery } from "@/lib/db-proxy";
import type { UserRole, UserStatus } from "@prisma/client";

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

  const [dbUser] = await dbQuery<CurrentUser>(
    [
      'SELECT "id", "email", "name", "role", "status", "displayName", "avatarUrl", "bannerUrl",',
      '"handle", "pronouns", "bio", "locale", "timeZone", "theme", "loginAlerts",',
      '"twoFactorEnabled", "notificationEmailOptIn", "notificationPushOptIn", "notificationInAppOptIn"',
      'FROM "User" WHERE "id" = $1 LIMIT 1',
    ].join(" "),
    [sessionUser.id],
  );

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
