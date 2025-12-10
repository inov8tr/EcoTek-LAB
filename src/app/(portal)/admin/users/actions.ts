"use server";

import { revalidatePath } from "next/cache";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

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

export async function createUser(formData: FormData) {
  await requireRole([UserRole.ADMIN]);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? UserRole.VIEWER) as UserRole;
  const status = String(formData.get("status") ?? UserStatus.PENDING) as UserStatus;

  if (!name || !email || !password) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status,
        displayName: name,
      },
    });
  } catch (err) {
    console.error("createUser error", err);
  }

  revalidatePath("/admin/users");
}
