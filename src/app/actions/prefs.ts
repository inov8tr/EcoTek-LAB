"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function updateQuickPrefs(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const theme = (formData.get("theme") ?? "").toString() || null;
  const locale = (formData.get("locale") ?? "").toString() || null;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      theme: theme ?? undefined,
      locale: locale ?? undefined,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
