import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{
    name: string;
    description?: string | null;
    testResultIds?: Array<string | number>;
    binderTestIds?: string[];
  }>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const { name, description, testResultIds, binderTestIds } = body;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const normalizedIds = (testResultIds ?? [])
    .map((id: string | number) => (typeof id === "string" ? Number(id) : id))
    .filter((id: number) => Number.isFinite(id));

  const normalizedBinderIds = Array.isArray(binderTestIds)
    ? [...new Set(binderTestIds.filter(Boolean))]
    : [];

  const binderTests = normalizedBinderIds.length
    ? await prisma.binderTest.findMany({
        where: { id: { in: normalizedBinderIds }, status: { not: "ARCHIVED" } },
        select: {
          id: true,
          batchId: true,
          name: true,
          testName: true,
          pgHigh: true,
          pgLow: true,
          softeningPointC: true,
          viscosity155_cP: true,
          ductilityCm: true,
          recoveryPct: true,
          jnr_3_2: true,
          lab: true,
        },
      })
    : [];

  const ensureDefaultFormulation = async () => {
    const existing = await prisma.formulation.findFirst({
      where: { code: "AUTO-BINDER" },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await prisma.formulation.create({
      data: {
        slug: "auto-binder",
        code: "AUTO-BINDER",
        name: "Auto-created binder formulation",
        description: "Placeholder formulation created for binder analytics when no formulations exist.",
      },
      select: { id: true },
    });
    return created.id;
  };

  const binderBatchIds = binderTests
    .map((bt) => bt.batchId?.trim())
    .filter((id): id is string => Boolean(id));

  const numericBatchIds = binderBatchIds
    .map((id) => Number(id))
    .filter((id): id is number => Number.isInteger(id));

  const batchWhere: any[] = [];
  if (numericBatchIds.length) {
    batchWhere.push({ id: { in: numericBatchIds } });
  }
  const uniqueBatchStrings = Array.from(new Set(binderBatchIds));
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

  const batchByKey = new Map<string, number>();
  for (const b of batches) {
    batchByKey.set(String(b.id), b.id);
    if (b.slug) {
      batchByKey.set(b.slug, b.id);
      batchByKey.set(b.slug.toLowerCase(), b.id);
    }
    if (b.batchCode) {
      batchByKey.set(b.batchCode, b.id);
      batchByKey.set(b.batchCode.toLowerCase(), b.id);
    }
  }

  // Ensure a TestResult exists for each binder test selected
  const missing: { binderTestId: string; batchId?: string | null }[] = [];
  for (const bt of binderTests) {
    const batchKey = bt.batchId?.trim();
    let batchId =
      batchKey &&
      (batchByKey.get(batchKey) ??
        batchByKey.get(batchKey.toLowerCase()) ??
        batchByKey.get(String(Number(batchKey))));

    if (!batchId) {
      // Attempt to auto-create a batch + formulation if nothing exists
      const formulationId = await ensureDefaultFormulation();
      const slugBase = (batchKey || `binder-${bt.id}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
      const slug = slugBase || `binder-${bt.id.slice(0, 8)}`;
      try {
        const createdBatch = await prisma.batch.create({
          data: {
            slug: slug.length > 40 ? slug.slice(0, 40) : slug,
            batchCode: batchKey || slug.toUpperCase(),
            formulationId,
            dateMixed: new Date(),
            binderPgHigh: bt.pgHigh ?? undefined,
            binderPgLow: bt.pgLow ?? undefined,
            binderName: bt.name ?? bt.testName ?? undefined,
            labName: bt.lab ?? undefined,
          },
          select: { id: true, slug: true, batchCode: true },
        });
        batchId = createdBatch.id;
        batchByKey.set(createdBatch.batchCode, createdBatch.id);
        batchByKey.set(createdBatch.batchCode.toLowerCase(), createdBatch.id);
        batchByKey.set(createdBatch.slug, createdBatch.id);
        batchByKey.set(createdBatch.slug.toLowerCase(), createdBatch.id);
      } catch {
        // record as missing if creation fails
        missing.push({ binderTestId: bt.id, batchId: batchKey });
        continue;
      }
    }

    const existing = await prisma.testResult.findFirst({ where: { batchId }, select: { id: true } });
    const testResultId =
      existing?.id ??
      (
        await prisma.testResult.create({
          data: {
            batchId,
            pgHigh: bt.pgHigh ?? undefined,
            pgLow: bt.pgLow ?? undefined,
            softeningPoint: bt.softeningPointC ?? undefined,
            viscosity135: bt.viscosity155_cP ?? undefined,
            ductility25: bt.ductilityCm ?? undefined,
            recovery: bt.recoveryPct ?? undefined,
            jnr: bt.jnr_3_2 ?? undefined,
            labName: bt.lab ?? undefined,
          },
        })
      ).id;

    if (!normalizedIds.includes(testResultId)) {
      normalizedIds.push(testResultId);
    }
  }

  if (normalizedIds.length === 0) {
    if (missing.length) {
      const details = missing
        .slice(0, 5)
        .map((m) => `${m.binderTestId} (batch: ${m.batchId ?? "none"})`)
        .join(", ");
      return NextResponse.json(
        {
          error:
            "No test results found for selected binder tests. Ensure the Batch ID matches an existing batch slug or code.",
          missing: missing.map((m) => ({ binderTestId: m.binderTestId, batchId: m.batchId ?? null })),
          sample: details ? `Examples: ${details}` : undefined,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No test results found for selected binder tests. Ensure they reference an existing batch slug or code." },
      { status: 400 }
    );
  }

  const set = await prisma.analysisSet.create({
    data: {
      name,
      description,
      ownerId: user?.id,
      tests: {
        create: normalizedIds.map((id: number) => ({
          testResultId: id,
        })),
      },
    },
  });

  return NextResponse.json({ data: set });
}
