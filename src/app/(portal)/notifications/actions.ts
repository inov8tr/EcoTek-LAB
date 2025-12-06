"use server";

import { revalidatePath } from "next/cache";
import { UserStatus } from "@prisma/client";
import { requireStatus } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { publishNotification } from "@/lib/realtime";

export async function markNotificationRead(formData: FormData) {
  const user = await requireStatus(UserStatus.ACTIVE);
  const id = (formData.get("id") ?? "").toString();
  if (!id) return;
  await prisma.securityEvent.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  await publishNotification(user.id, { type: "read", id });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireStatus(UserStatus.ACTIVE);
  await prisma.securityEvent.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  await publishNotification(user.id, { type: "read_all" });
  revalidatePath("/notifications");
}
