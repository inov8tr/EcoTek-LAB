import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest } from "@/lib/api/guard";

export async function GET() {
  const { errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB", "VIEWER"] });
  if (errorResponse) return errorResponse;

  const binderTests = await prisma.binderTest.findMany({
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
    .map((bt) => Number(bt.batchId))
    .filter((id): id is number => Number.isInteger(id));

  const testResults = batchIds.length
    ? await prisma.testResult.findMany({
        where: { batchId: { in: batchIds } },
        include: { batch: { select: { batchCode: true } } },
      })
    : [];

  const testResultByBatch = new Map<number, (typeof testResults)[number]>();
  for (const tr of testResults) {
    testResultByBatch.set(tr.batchId, tr);
  }

  const data = binderTests.map((bt) => {
    const batchIdInt = Number(bt.batchId);
    const linked = Number.isInteger(batchIdInt) ? testResultByBatch.get(batchIdInt) : null;
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
