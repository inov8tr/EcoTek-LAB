"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

function parseNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createBinderTest(formData: FormData) {
  await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  throw new Error("Legacy binder tests have been deprecated. Use Binder Test Data in admin.");
}
