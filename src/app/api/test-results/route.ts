import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluatePma,
  DEFAULT_KOREA_PMA_PG82_22,
  type PmaThresholds,
} from "@/lib/tests/pma-evaluator";

function buildThresholdsFromStandard(standard?: {
  maxStorabilityPct: number | null;
  minSolubilityPct: number | null;
  maxJnr: number | null;
  minElasticRecoveryPct: number | null;
  minSofteningPointC: number | null;
  minDuctilityCm: number | null;
  maxViscosityPaS: number | null;
  minPgHigh: number | null;
  maxPgLow: number | null;
}): PmaThresholds {
  if (!standard) {
    return DEFAULT_KOREA_PMA_PG82_22;
  }
  return {
    maxStorabilityPct: standard.maxStorabilityPct ?? DEFAULT_KOREA_PMA_PG82_22.maxStorabilityPct,
    minSolubilityPct: standard.minSolubilityPct ?? DEFAULT_KOREA_PMA_PG82_22.minSolubilityPct,
    maxJnr: standard.maxJnr ?? DEFAULT_KOREA_PMA_PG82_22.maxJnr,
    minElasticRecoveryPct:
      standard.minElasticRecoveryPct ?? DEFAULT_KOREA_PMA_PG82_22.minElasticRecoveryPct,
    minSofteningPointC:
      standard.minSofteningPointC ?? DEFAULT_KOREA_PMA_PG82_22.minSofteningPointC,
    minDuctilityCm: standard.minDuctilityCm ?? DEFAULT_KOREA_PMA_PG82_22.minDuctilityCm,
    maxViscosityPaS: standard.maxViscosityPaS ?? DEFAULT_KOREA_PMA_PG82_22.maxViscosityPaS,
    minPgHigh: standard.minPgHigh ?? DEFAULT_KOREA_PMA_PG82_22.minPgHigh,
    maxPgLow: standard.maxPgLow ?? DEFAULT_KOREA_PMA_PG82_22.maxPgLow,
  };
}

function buildEvaluationInput(body: Record<string, unknown>) {
  return {
    storabilityPct: toNumber(body.storabilityPct),
    solubilityPct: toNumber(body.solubilityPct),
    jnr: toNumber(body.jnr),
    elasticRecoveryPct: toNumber(body.elasticRecoveryPct),
    softeningPointC: toNumber(body.softeningPointC),
    ductilityCm: toNumber(body.ductilityCm),
    viscosityPaS: toNumber(body.viscosityPaS),
    pgHigh: body.pgHigh != null ? Number(body.pgHigh) : undefined,
    pgLow: body.pgLow != null ? Number(body.pgLow) : undefined,
  };
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function resolveThresholds(standardId?: number | null) {
  // Legacy standards lookup is not available; fallback to default thresholds.
  return DEFAULT_KOREA_PMA_PG82_22;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchIdParam = searchParams.get("batchId");
  const formulationIdParam = searchParams.get("formulationId");

  if (!batchIdParam && !formulationIdParam) {
    return NextResponse.json(
      { error: "Provide either batchId or formulationId" },
      { status: 400 },
    );
  }

  const where = batchIdParam
    ? { batchId: Number(batchIdParam) }
    : {
        batch: {
          formulationId: formulationIdParam ? Number(formulationIdParam) : undefined,
        },
      };

  const results = await prisma.testResult.findMany({
    where,
    include: {
      batch: {
        include: {
          formulation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(results);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const batchId = Number(body.batchId);
    if (!Number.isFinite(batchId)) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const standardId = body.standardId ? Number(body.standardId) : undefined;
    const thresholds = await resolveThresholds(standardId);
    const evalResult = evaluatePma(buildEvaluationInput(body), thresholds);

    const created = await prisma.testResult.create({
      data: {
        batchId,
        label: body.label ?? null,
        labReportId: body.labReportId ?? null,
        storabilityPct: toNumber(body.storabilityPct),
        solubilityPct: toNumber(body.solubilityPct),
        jnr: toNumber(body.jnr),
        elasticRecoveryPct: toNumber(body.elasticRecoveryPct),
        softeningPointC: toNumber(body.softeningPointC),
        ductilityCm: toNumber(body.ductilityCm),
        viscosityPaS: toNumber(body.viscosityPaS),
        pgHigh: body.pgHigh != null ? Number(body.pgHigh) : null,
        pgLow: body.pgLow != null ? Number(body.pgLow) : null,
        temperatureC: toNumber(body.temperatureC),
        remarks: body.remarks ?? null,
        overallOutcome: evalResult.outcome,
        failedReasons: evalResult.failedReasons.length ? evalResult.failedReasons.join("; ") : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/test-results", error);
    return NextResponse.json({ error: "Unable to create test result" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.testResult.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Test result not found" }, { status: 404 });
    }

    const payload = {
      storabilityPct:
        body.storabilityPct !== undefined ? toNumber(body.storabilityPct) : existing.storabilityPct,
      solubilityPct:
        body.solubilityPct !== undefined ? toNumber(body.solubilityPct) : existing.solubilityPct,
      jnr: body.jnr !== undefined ? toNumber(body.jnr) : existing.jnr,
      elasticRecoveryPct:
        body.elasticRecoveryPct !== undefined
          ? toNumber(body.elasticRecoveryPct)
          : existing.elasticRecoveryPct,
      softeningPointC:
        body.softeningPointC !== undefined
          ? toNumber(body.softeningPointC)
          : existing.softeningPointC,
      ductilityCm:
        body.ductilityCm !== undefined ? toNumber(body.ductilityCm) : existing.ductilityCm,
      viscosityPaS:
        body.viscosityPaS !== undefined ? toNumber(body.viscosityPaS) : existing.viscosityPaS,
      pgHigh: body.pgHigh !== undefined ? Number(body.pgHigh) : existing.pgHigh,
      pgLow: body.pgLow !== undefined ? Number(body.pgLow) : existing.pgLow,
    };

    const thresholds = await resolveThresholds(body.standardId ? Number(body.standardId) : undefined);
    const evalResult = evaluatePma(payload, thresholds);

    const updated = await prisma.testResult.update({
      where: { id },
      data: {
        label: body.label ?? existing.label,
        labReportId: body.labReportId ?? existing.labReportId,
        storabilityPct: payload.storabilityPct,
        solubilityPct: payload.solubilityPct,
        jnr: payload.jnr,
        elasticRecoveryPct: payload.elasticRecoveryPct,
        softeningPointC: payload.softeningPointC,
        ductilityCm: payload.ductilityCm,
        viscosityPaS: payload.viscosityPaS,
        pgHigh: payload.pgHigh,
        pgLow: payload.pgLow,
        temperatureC:
          body.temperatureC !== undefined ? toNumber(body.temperatureC) : existing.temperatureC,
        remarks: body.remarks ?? existing.remarks,
        overallOutcome: evalResult.outcome,
        failedReasons: evalResult.failedReasons.length ? evalResult.failedReasons.join("; ") : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/test-results", error);
    return NextResponse.json({ error: "Unable to update test result" }, { status: 500 });
  }
}
