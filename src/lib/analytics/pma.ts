import { prisma } from "@/lib/prisma";

export async function getStorageStabilityTrend(capsuleFormulaId?: string) {
  const batches = await prisma.pmaBatch.findMany({
    where: capsuleFormulaId
      ? { pmaFormula: { capsuleFormulaId } }
      : undefined,
    include: {},
    orderBy: { createdAt: "asc" },
  });

  return batches.map((b) => ({
    label: b.batchCode,
    value: 0,
  }));
}

export async function getRecoveryVsReagent(pmaFormulaId?: string) {
  // PMA test results are removed in this build; return empty.
  return [];
}

export async function getEcoCapVsSofteningPoint() {
  // PMA test results are removed in this build; return empty.
  return [];
}

export async function getPgImprovementByBitumenSource(bitumenOriginId?: string) {
  const formulas = await prisma.pmaFormula.findMany({
    where: bitumenOriginId ? { bitumenOriginId } : undefined,
    include: {
      bitumenTest: true,
      batches: {},
    },
  });

  return formulas.map((f) => {
    const baseHigh = f.bitumenTest?.basePgHigh ?? 0;
    const baseLow = f.bitumenTest?.basePgLow ?? 0;
    const pgHigh = baseHigh;
    const pgLow = baseLow;
    return {
      originId: f.bitumenOriginId,
      formulaId: f.id,
      deltaHigh: pgHigh - baseHigh,
      deltaLow: pgLow - baseLow,
    };
  });
}

export async function getViscosityInfluenceMatrix() {
  // PMA test results are removed in this build; return empty.
  return [];
}

export async function getFullPmaFormula(id: string) {
  return prisma.pmaFormula.findUnique({
    where: { id },
    include: {
      capsuleFormula: true,
      bitumenOrigin: true,
      bitumenTest: true,
      batches: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getSofteningPointStability() {
  const batches = await prisma.pmaBatch.findMany({
    include: {},
    orderBy: { createdAt: "asc" },
  });

  return batches.map((b) => ({
    label: b.batchCode,
    softeningPoint: 0,
  }));
}

export async function getViscosityCurves() {
  // PMA test results are removed in this build; return empty.
  return [];
}

export async function getPgHighLowMap() {
  // PMA test results are removed in this build; return empty.
  return [];
}

export async function getDsrTrendSeries() {
  // PMA test results are removed in this build; return empty.
  return [];
}
