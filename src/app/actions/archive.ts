"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

type ArchiveTarget = "formulation" | "batch" | "test";

const BASE_REVALIDATE_PATHS = ["/dashboard", "/analytics", "/formulations", "/batches"];

async function ensureAdmin() {
  await requireRole([UserRole.ADMIN]);
}

function runRevalidations(paths: string[]) {
  const uniquePaths = Array.from(new Set([...BASE_REVALIDATE_PATHS, ...paths]));
  uniquePaths.forEach((path) => revalidatePath(path));
}

async function setArchiveState(target: ArchiveTarget, identifier: string, archived: boolean) {
  await ensureAdmin();

  if (!identifier) {
    throw new Error(`Missing identifier for ${target} archive update.`);
  }

  if (target === "formulation") {
    const record = await prisma.formulation.update({
      where: { slug: identifier },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
      },
      select: { slug: true },
    });
    runRevalidations([`/formulations/${record.slug}`]);
    return;
  }

  if (target === "batch") {
    const record = await prisma.batch.update({
      where: { slug: identifier },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
      },
      include: {
        formulation: { select: { slug: true } },
      },
    });
    runRevalidations([`/batches/${record.slug}`, `/formulations/${record.formulation.slug}`]);
    return;
  }

  const testId = Number(identifier);
  if (!Number.isFinite(testId)) {
    throw new Error("Invalid test id");
  }
  throw new Error("Legacy binder tests are deprecated. Use Binder Test Data instead.");
}

export async function archiveFormulation(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await setArchiveState("formulation", slug, true);
}

export async function restoreFormulation(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await setArchiveState("formulation", slug, false);
}

export async function archiveBatch(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await setArchiveState("batch", slug, true);
}

export async function restoreBatch(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await setArchiveState("batch", slug, false);
}

export async function archiveTest(formData: FormData) {
  const id = String(formData.get("testId") ?? "");
  await setArchiveState("test", id, true);
}

export async function restoreTest(formData: FormData) {
  const id = String(formData.get("testId") ?? "");
  await setArchiveState("test", id, false);
}
