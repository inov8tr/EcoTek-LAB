import { prisma } from "@/lib/prisma";
import type { StorageStabilityMethod, VariableKey } from "@/types/analytics";

function normalizeTestResultIds(testResultIds?: Array<string | number>) {
  if (!testResultIds) return undefined;
  const normalized = testResultIds
    .map((id) => (typeof id === "string" ? Number(id) : id))
    .filter((id): id is number => Number.isFinite(id));
  return normalized.length ? normalized : undefined;
}

// Helper to load TestResults + related batch data for analytics
export async function loadAnalyticsTestResults(testResultIds?: Array<string | number>) {
  const normalizedIds = normalizeTestResultIds(testResultIds);
  const whereClause = normalizedIds ? { id: { in: normalizedIds } } : {};

  return prisma.testResult.findMany({
    where: whereClause,
    select: {
      id: true,
      pgHigh: true,
      pgLow: true,
      softeningTop: true,
      softeningBottom: true,
      deltaSoftening: true,
      viscosity135: true,
      softeningPoint: true,
      ductility15: true,
      ductility25: true,
      recovery: true,
      jnr: true,
      solubility: true,
      storageStabilityRecoveryPercent: true,
      storageStabilityGstarPercent: true,
      storageStabilityJnrPercent: true,
      batch: {
        select: {
          batchCode: true,
        },
      },
    },
  });
}

// Extract variable from related models using a dynamic variableKey
export function extractVariableValue(result: any, variableKey: VariableKey): number | null {
  // variable keys like "capsule.sbsPercent", "pma.capsuleDosagePercent"
  const [root, field] = variableKey.split(".");

  switch (root) {
    case "capsule":
      return result.batch?.pmaFormula?.capsuleFormula?.[field] ?? null;
    case "pma":
      // Some implementations store PMA data directly on the batch
      return result.batch?.pmaFormula?.[field] ?? result.batch?.[field] ?? null;
    case "bitumenOrigin":
      return result.batch?.pmaFormula?.bitumenOrigin?.[field] ?? null;
    default:
      return null;
  }
}

// Extract Y-axis value based on storage stability method
export function extractStorageStabilityValue(result: any, method: StorageStabilityMethod): number | null {
  switch (method) {
    case "RECOVERY":
      return result.storageStabilityRecoveryPercent ?? null;
    case "GSTAR":
      return result.storageStabilityGstarPercent ?? null;
    case "JNR":
      return result.storageStabilityJnrPercent ?? null;
    case "DELTA_SOFTENING":
      return result.deltaSoftening ?? null;
    default:
      return null;
  }
}

// Generic binder metric extractor
export function extractBinderMetric(result: any, metricType: string): number | null {
  switch (metricType) {
    case "SOFTENING_POINT":
      return result.softeningPoint ?? result.deltaSoftening ?? null;
    case "DUCTILITY_15":
      return result.ductility15 ?? null;
    case "DUCTILITY_25":
      return result.ductility25 ?? null;
    case "VISCOSITY_135":
      return result.viscosity135 ?? null;
    case "ELASTIC_RECOVERY":
      return result.recovery ?? null;
    case "JNR":
      return result.jnr ?? null;
    case "SOLUBILITY":
      return result.solubility ?? null;
    case "PG_HIGH":
      return result.pgHigh ?? null;
    case "PG_LOW":
      return result.pgLow ?? null;
    default:
      return null;
  }
}
