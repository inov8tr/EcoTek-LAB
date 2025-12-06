import { redirect } from "next/navigation";
import type { Route } from "next";
import { auth } from "@/auth";
import { UserRole, UserStatus } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
  status: UserStatus;
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
