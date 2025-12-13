import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest } from "@/lib/api/guard";

export async function GET() {
  const { errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB", "VIEWER"] });
  if (errorResponse) return errorResponse;

  const binderTests = await prisma.binderTest.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      testName: true,
      batchId: true,
      softeningPointC: true,
      viscosity155_cP: true,
      ductilityCm: true,
      recoveryPct: true,
      jnr_3_2: true,
    },
  });

  const batchIds = binderTests
    .map((bt) => bt.batchId?.trim())
    .filter((id): id is string => Boolean(id));
  const numericBatchIds = batchIds
    .map((id) => Number(id))
    .filter((id): id is number => Number.isInteger(id));

  const batchWhere: any[] = [];
  if (numericBatchIds.length) {
    batchWhere.push({ id: { in: numericBatchIds } });
  }
  const uniqueBatchStrings = Array.from(new Set(batchIds));
  for (const id of uniqueBatchStrings) {
    batchWhere.push({ slug: { equals: id, mode: "insensitive" } });
    batchWhere.push({ batchCode: { equals: id, mode: "insensitive" } });
  }

  const batches = batchWhere.length
    ? await prisma.batch.findMany({
        where: { OR: batchWhere },
        select: { id: true, slug: true, batchCode: true },
      })
    : [];

  const batchIdsToLookup = batches.map((b) => b.id);

  const batchKeyMap = new Map<string, number>();
  for (const b of batches) {
    batchKeyMap.set(String(b.id), b.id);
    if (b.slug) {
      batchKeyMap.set(b.slug, b.id);
      batchKeyMap.set(b.slug.toLowerCase(), b.id);
    }
    if (b.batchCode) {
      batchKeyMap.set(b.batchCode, b.id);
      batchKeyMap.set(b.batchCode.toLowerCase(), b.id);
    }
  }

  const testResults = batchIdsToLookup.length
    ? await prisma.testResult.findMany({
        where: { batchId: { in: batchIdsToLookup } },
        include: { batch: { select: { batchCode: true, slug: true } } },
      })
    : [];

  const testResultByBatch = new Map<number, (typeof testResults)[number]>();
  for (const tr of testResults) {
    testResultByBatch.set(tr.batchId, tr);
  }

  const data = binderTests.map((bt) => {
    const batchKeyRaw = bt.batchId?.trim();
    const batchKeyLower = batchKeyRaw?.toLowerCase();
    const batchIdFromMap =
      (batchKeyRaw ? batchKeyMap.get(batchKeyRaw) : null) ??
      (batchKeyLower ? batchKeyMap.get(batchKeyLower) : null);
    const batchIdInt = Number(batchKeyRaw);
    const linkedById =
      Number.isInteger(batchIdInt) && batchIdFromMap
        ? testResultByBatch.get(batchIdFromMap)
        : Number.isInteger(batchIdInt)
          ? testResultByBatch.get(batchIdInt)
          : null;
    const linkedBySlug = testResults.find(
      (tr) =>
        tr.batch.slug === batchKeyRaw ||
        tr.batch.slug?.toLowerCase() === batchKeyLower
    );
    const linkedByCode = testResults.find(
      (tr) =>
        tr.batch.batchCode === batchKeyRaw ||
        tr.batch.batchCode?.toLowerCase() === batchKeyLower
    );
    const linked = linkedById ?? linkedBySlug ?? linkedByCode ?? null;
    return {
      binderTestId: bt.id,
      testResultId: linked?.id ?? null,
      label: bt.name ?? bt.testName ?? `Binder Test ${bt.id.slice(0, 6)}`,
      batchCode: linked?.batch?.batchCode ?? bt.batchId ?? null,
      softeningPoint: linked?.softeningPoint ?? bt.softeningPointC ?? null,
      hasTestResult: Boolean(linked?.id),
    };
  });

  return NextResponse.json({ data });
}
