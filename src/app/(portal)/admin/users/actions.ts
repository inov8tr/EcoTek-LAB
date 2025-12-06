"use server";

import { revalidatePath } from "next/cache";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function updateUserStatus(formData: FormData) {
  await requireRole([UserRole.ADMIN]);
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "") as UserStatus;

  if (!userId || !Object.values(UserStatus).includes(status)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });
  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  await requireRole([UserRole.ADMIN]);
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!userId || !Object.values(UserRole).includes(role)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireRole([UserRole.ADMIN]);
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === admin.id) return;

  await prisma.user.delete({
    where: { id: userId },
  });
  revalidatePath("/admin/users");
}
