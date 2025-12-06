import { prisma } from "@/lib/prisma";

export async function getStorageStabilityTrend(capsuleFormulaId?: string) {
  const batches = await prisma.pmaBatch.findMany({
    where: capsuleFormulaId
      ? { pmaFormula: { capsuleFormulaId } }
      : undefined,
    include: { testResults: true },
    orderBy: { createdAt: "asc" },
  });

  return batches.map((b) => ({
    label: b.batchCode,
    value: b.testResults[0]?.storageStabilityDifference ?? 0,
  }));
}

export async function getRecoveryVsReagent(pmaFormulaId?: string) {
  const formulas = await prisma.pmaFormula.findMany({
    where: pmaFormulaId ? { id: pmaFormulaId } : undefined,
    include: { batches: { include: { testResults: true } } },
  });

  const points: { reagent: number; recovery: number }[] = [];
  formulas.forEach((f) => {
    f.batches.forEach((b) => {
      const recovery = b.testResults[0]?.elasticRecovery;
      if (recovery !== null && recovery !== undefined) {
        points.push({ reagent: f.reagentPercentage, recovery });
      }
    });
  });
  return points;
}

export async function getEcoCapVsSofteningPoint() {
  const formulas = await prisma.pmaFormula.findMany({
    include: { batches: { include: { testResults: true } } },
  });

  const points: { ecoCap: number; softeningPoint: number }[] = [];
  formulas.forEach((f) => {
    f.batches.forEach((b) => {
      const sp = b.testResults[0]?.softeningPoint;
      if (sp !== null && sp !== undefined) {
        points.push({ ecoCap: f.ecoCapPercentage, softeningPoint: sp });
      }
    });
  });
  return points;
}

export async function getPgImprovementByBitumenSource(bitumenOriginId?: string) {
  const formulas = await prisma.pmaFormula.findMany({
    where: bitumenOriginId ? { bitumenOriginId } : undefined,
    include: {
      bitumenTest: true,
      batches: { include: { testResults: true } },
    },
  });

  return formulas.map((f) => {
    const latest = f.batches[0]?.testResults[0];
    const baseHigh = f.bitumenTest?.basePgHigh ?? 0;
    const baseLow = f.bitumenTest?.basePgLow ?? 0;
    const pgHigh = latest?.pgHigh ?? baseHigh;
    const pgLow = latest?.pgLow ?? baseLow;
    return {
      originId: f.bitumenOriginId,
      formulaId: f.id,
      deltaHigh: pgHigh - baseHigh,
      deltaLow: pgLow - baseLow,
    };
  });
}

export async function getViscosityInfluenceMatrix() {
  const results = await prisma.pmaTestResult.findMany({
    include: { pmaBatch: { include: { pmaFormula: true } } },
  });
  return results.map((r) => ({
    formulaId: r.pmaBatch.pmaFormulaId,
    viscosity135: r.viscosity135 ?? 0,
    viscosity165: r.viscosity165 ?? 0,
    pgHigh: r.pgHigh ?? 0,
    pgLow: r.pgLow ?? 0,
  }));
}

export async function getFullPmaFormula(id: string) {
  return prisma.pmaFormula.findUnique({
    where: { id },
    include: {
      capsuleFormula: { include: { materials: true } },
      bitumenOrigin: true,
      bitumenTest: true,
      batches: {
        include: { testResults: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
