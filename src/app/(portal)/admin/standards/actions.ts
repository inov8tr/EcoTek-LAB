"use server";

import { revalidatePath } from "next/cache";
import { RequirementComparison, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function createMarket(formData: FormData) {
  await requireRole([UserRole.ADMIN]);
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) return;
  await prisma.market.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
  revalidatePath("/admin/standards");
}

export async function createStandard(formData: FormData) {
  await requireRole([UserRole.ADMIN]);
  const marketId = Number(formData.get("marketId"));
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!marketId || !code || !name) return;
  await prisma.standard.upsert({
    where: { code },
    update: { name, description, marketId },
    create: { code, name, description, marketId },
  });
  revalidatePath("/admin/standards");
}

export async function createRequirement(formData: FormData) {
  await requireRole([UserRole.ADMIN]);
  const standardId = Number(formData.get("standardId"));
  const metric = String(formData.get("metric") ?? "").trim();
  const comparison = String(formData.get("comparison") ?? "") as RequirementComparison;
  const thresholdMin = formData.get("thresholdMin");
  const thresholdMax = formData.get("thresholdMax");
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!standardId || !metric || !Object.values(RequirementComparison).includes(comparison)) {
    return;
  }

  await prisma.standardRequirement.create({
    data: {
      standardId,
      metric,
      comparison,
      thresholdMin: thresholdMin === "" ? null : Number(thresholdMin),
      thresholdMax: thresholdMax === "" ? null : Number(thresholdMax),
      unit,
      notes,
    },
  });

  revalidatePath("/admin/standards");
}
