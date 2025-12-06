import { RequirementComparison } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const complianceFieldMap = {
  storabilityPct: "storabilityPass",
  elasticRecoveryPct: "recoveryPass",
  jnr_3_2: "jnrPass",
  softeningPointC: "softeningPass",
  ductilityCm: "ductilityPass",
  viscosity155c: "viscosityPass",
  solubilityPct: "solubilityPass",
} as const;

const metricFieldMap: Record<string, string> = {
  jnr_3_2: "jnr",
  viscosity155c: "viscosityPaS",
};

type ComplianceField = (typeof complianceFieldMap)[keyof typeof complianceFieldMap];

function evaluateRequirementValue(
  comparison: RequirementComparison,
  min: number | null,
  max: number | null,
  value: number | null,
) {
  if (value === null || Number.isNaN(value)) return null;

  switch (comparison) {
    case "LTE":
      return typeof max === "number" ? value <= max : null;
    case "GTE":
      return typeof min === "number" ? value >= min : null;
    case "BETWEEN":
      return typeof min === "number" && typeof max === "number"
        ? value >= min && value <= max
        : null;
    default:
      return null;
  }
}

function assignComplianceField(
  result: Record<ComplianceField, boolean | null>,
  metric: string,
  value: boolean | null
) {
  const field = complianceFieldMap[metric as keyof typeof complianceFieldMap];
  if (field) result[field] = value;
}

function readMetric(record: Record<string, unknown>, metric: string) {
  const field = metricFieldMap[metric] ?? metric;
  const raw = record[field];
  const numeric = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function evaluateComplianceForTest(testId: number) {
  // Validate model existence before use (prevents build errors)
  if (!(prisma as any).complianceResult) {
    console.warn("[compliance] complianceResult model missing — aborting evaluation");
    return;
  }

  const test = await prisma.testResult.findUnique({
    where: { id: testId },
  });

  if (!test) {
    console.warn(`[compliance] No testResult record for ID ${testId}`);
    return;
  }

  const standards = await prisma.standard.findMany({
    include: { requirements: true },
  });

  for (const standard of standards) {
    const complianceResult: Record<ComplianceField, boolean | null> = {
      storabilityPass: null,
      recoveryPass: null,
      jnrPass: null,
      softeningPass: null,
      ductilityPass: null,
      viscosityPass: null,
      solubilityPass: null,
    };

    for (const requirement of standard.requirements) {
      const numeric = readMetric(test as Record<string, unknown>, requirement.metric);

      const pass = evaluateRequirementValue(
        requirement.comparison,
        requirement.thresholdMin ?? null,
        requirement.thresholdMax ?? null,
        numeric,
      );

      assignComplianceField(complianceResult, requirement.metric, pass);
    }

    const checks = Object.values(complianceResult).filter(
      (v): v is boolean => typeof v === "boolean",
    );
    const overallPass = checks.length ? checks.every(Boolean) : null;

    await (prisma as any).complianceResult.upsert({
      where: {
        testId_standardId: {
          testId,
          standardId: standard.id,
        },
      },
      update: {
        ...complianceResult,
        overallPass,
      },
      create: {
        testId,
        standardId: standard.id,
        ...complianceResult,
        overallPass,
      },
    });
  }
}
