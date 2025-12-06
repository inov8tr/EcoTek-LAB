"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";

function toNumber(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function generateCurve(duration: number | null, start: number | null, end: number | null) {
  if (!duration || !start || !end) {
    return [
      { minute: 0, temperature: start ?? 0 },
      { minute: 60, temperature: end ?? start ?? 0 },
    ];
  }
  const segments = 5;
  const increment = duration / segments;
  const delta = ((end ?? start) - (start ?? end ?? 0)) / segments;
  return Array.from({ length: segments + 1 }).map((_, index) => ({
    minute: Number((index * increment).toFixed(1)),
    temperature: Number(((start ?? 0) + delta * index).toFixed(1)),
  }));
}

export async function createBatch(formData: FormData) {
  await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);

  const formulationId = Number(formData.get("formulationId"));
  const batchCode = String(formData.get("batchCode") ?? "").trim();
  const dateMixed = String(formData.get("dateMixed") ?? "");
  const operator = String(formData.get("operator") ?? "").trim() || null;
  const rpm = toNumber(formData.get("rpm"));
  const startTemp = toNumber(formData.get("startTemp"));
  const finalTemp = toNumber(formData.get("finalTemp"));
  const duration = toNumber(formData.get("duration"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!formulationId || !batchCode || !dateMixed) {
    throw new Error("Please complete the required fields.");
  }

  const slugBase = slugify(batchCode);
  const slug = slugBase || `batch-${Date.now()}`;

  const batch = await prisma.batch.create({
    data: {
      slug,
      batchCode,
      formulationId,
      dateMixed: new Date(dateMixed),
      operator,
      rpm: rpm ?? null,
      mixingTempInitial: startTemp ?? null,
      mixingTempFinal: finalTemp ?? null,
      mixingDurationMinutes: duration ?? null,
      mixingNotes: notes,
      mixingCurve: generateCurve(duration, startTemp, finalTemp),
    },
  });

  revalidatePath("/batches");
  redirect(`/batches/${batch.slug}`);
}
