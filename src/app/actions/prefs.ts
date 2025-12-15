"use server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db-proxy";

export async function updateQuickPrefs(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const theme = (formData.get("theme") ?? "").toString() || null;
  const locale = (formData.get("locale") ?? "").toString() || null;
  await dbQuery(
    'UPDATE "User" SET "theme" = $1, "locale" = $2 WHERE "id" = $3',
    [theme, locale, user.id],
  );
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
