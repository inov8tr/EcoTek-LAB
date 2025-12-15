import { unstable_cache } from "next/cache";
import { RequirementComparison, UserStatus } from "@prisma/client";
import { dbQuery } from "@/lib/db-proxy";
import { getPrimaryStandard } from "@/lib/standards";
import { formatDate } from "@/lib/utils";

type PassFail = "pass" | "fail";

type RequirementLookup = Record<
  string,
  {
    comparison: RequirementComparison;
    min?: number | null;
    max?: number | null;
    unit?: string | null;
  }
>;

type TrendPoint = {
  batch: string;
  value: number;
};

type RecentBatchRow = {
  id: string;
  batch: string;
  formula: string;
  date: string;
  status: PassFail;
};

type MetricDatum = {
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  status: PassFail;
};

const fallbackRequirements: RequirementLookup = {
  solubilityPct: {
    comparison: RequirementComparison.GTE,
    min: 98,
    unit: "%",
  },
};

const metricFieldMap: Record<string, string> = {
  jnr_3_2: "jnr",
  viscosity155c: "viscosityPaS",
};

const withStaticCache = <T>(key: string, fn: () => Promise<T>, revalidate = 60) =>
  unstable_cache(fn, [key], { revalidate });

function getNumericMetric(record: Record<string, unknown>, metric: string) {
  const field = metricFieldMap[metric] ?? metric;
  const raw = record[field];
  const numeric = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

let requirementLookupPromise: Promise<RequirementLookup> | null = null;
async function getRequirementLookup() {
  if (!requirementLookupPromise) {
    requirementLookupPromise = (async () => {
      const standard = await getPrimaryStandard();
      const lookup: RequirementLookup = {};
      for (const requirement of standard.requirements) {
        lookup[requirement.metric] = {
          comparison: requirement.comparison,
          min: requirement.thresholdMin,
          max: requirement.thresholdMax,
          unit: requirement.unit,
        };
      }
      for (const [metric, config] of Object.entries(fallbackRequirements)) {
        if (!lookup[metric]) {
          lookup[metric] = config;
        }
      }
      return lookup;
    })();
  }
  return requirementLookupPromise;
}

function evaluateRequirement(metric: string, rawValue: unknown, lookup: RequirementLookup): PassFail {
  const config = lookup[metric];
  const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
  if (!config || Number.isNaN(value)) {
    return "fail";
  }

  const { comparison, min, max } = config;
  let pass = true;

  if (comparison === RequirementComparison.LTE && typeof max === "number") {
    pass = value <= max;
  } else if (comparison === RequirementComparison.GTE && typeof min === "number") {
    pass = value >= min;
  } else if (
    comparison === RequirementComparison.BETWEEN &&
    typeof min === "number" &&
    typeof max === "number"
  ) {
    pass = value >= min && value <= max;
  }

  return pass ? "pass" : "fail";
}

function mapStatus(status?: string | null): PassFail {
  return status?.toLowerCase() === "fail" ? "fail" : "pass";
}

function computeTrend(values: Array<number | null | undefined>): number | undefined {
  const filtered = values.filter((value) => typeof value === "number") as number[];
  if (filtered.length < 2) return undefined;
  const last = filtered[filtered.length - 1];
  const previous = filtered[filtered.length - 2];
  if (previous === 0) return undefined;
  const change = ((last - previous) / previous) * 100;
  if (!Number.isFinite(change)) return undefined;
  return Number(change.toFixed(1));
}

export const getDashboardData = withStaticCache("dashboard-data", async () => {
  const [lookup, tests, batches, pendingUsers] = await Promise.all([
    getRequirementLookup(),
    dbQuery<{
      id: number;
      storabilityPct: number | null;
      solubilityPct: number | null;
      elasticRecoveryPct: number | null;
      softeningPointC: number | null;
      viscosityPaS: number | null;
      jnr: number | null;
      createdAt: string;
      batchCode: string;
      formulationCode: string;
      formulationSlug: string;
    }>(
      [
        'SELECT tr."id", tr."storabilityPct", tr."solubilityPct", tr."elasticRecoveryPct", tr."softeningPointC",',
        'tr."viscosityPaS", tr."jnr", tr."createdAt",',
        'b."batchCode" AS "batchCode", f."code" AS "formulationCode", f."slug" AS "formulationSlug"',
        'FROM "TestResult" tr',
        'JOIN "Batch" b ON tr."batchId" = b."id"',
        'JOIN "Formulation" f ON b."formulationId" = f."id"',
        'WHERE b."archived" = false AND f."archived" = false',
        'ORDER BY tr."createdAt" ASC',
      ].join(" "),
    ),
    dbQuery<{
      id: string;
      batchCode: string;
      dateMixed: string | null;
      status: string | null;
      formulationCode: string;
      formulationSlug: string;
    }>(
      [
        'SELECT b."id", b."batchCode", b."dateMixed", b."status",',
        'f."code" AS "formulationCode", f."slug" AS "formulationSlug"',
        'FROM "Batch" b',
        'JOIN "Formulation" f ON b."formulationId" = f."id"',
        'WHERE b."archived" = false AND f."archived" = false',
        'ORDER BY b."dateMixed" DESC',
        'LIMIT 6',
      ].join(" "),
    ),
    dbQuery<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM "User" WHERE "status" = $1',
      [UserStatus.PENDING],
    ).then((rows) => Number(rows[0]?.count ?? 0)),
  ]);

  const latest = tests.at(-1);
  const metrics: MetricDatum[] = latest
    ? [
        {
          label: "Elastic Recovery",
          value: getNumericMetric(latest as Record<string, unknown>, "elasticRecoveryPct") ?? 0,
          unit: "%",
          trend: computeTrend(
            tests.map((test) =>
              getNumericMetric(test as Record<string, unknown>, "elasticRecoveryPct"),
            ),
          ),
          status: evaluateRequirement(
            "elasticRecoveryPct",
            getNumericMetric(latest as Record<string, unknown>, "elasticRecoveryPct"),
            lookup,
          ),
        },
        {
          label: "Storability",
          value: getNumericMetric(latest as Record<string, unknown>, "storabilityPct") ?? 0,
          unit: "%",
          trend: computeTrend(
            tests.map((test) =>
              getNumericMetric(test as Record<string, unknown>, "storabilityPct"),
            ),
          ),
          status: evaluateRequirement(
            "storabilityPct",
            getNumericMetric(latest as Record<string, unknown>, "storabilityPct"),
            lookup,
          ),
        },
        {
          label: "Jnr (3.2 kPa)",
          value: getNumericMetric(latest as Record<string, unknown>, "jnr_3_2") ?? 0,
          unit: "kPa⁻¹",
          trend: computeTrend(
            tests.map((test) => getNumericMetric(test as Record<string, unknown>, "jnr_3_2")),
          ),
          status: evaluateRequirement(
            "jnr_3_2",
            getNumericMetric(latest as Record<string, unknown>, "jnr_3_2"),
            lookup,
          ),
        },
      ]
    : [];

  const recentWindow = tests.slice(-8);
  const recoveryTrend: TrendPoint[] = recentWindow
    .map((test) => ({
      batch: test.batchCode,
      value: getNumericMetric(test as Record<string, unknown>, "elasticRecoveryPct") ?? 0,
    }))
    .filter((point) => typeof point.value === "number");

  const storabilityTrend: TrendPoint[] = recentWindow
    .map((test) => ({
      batch: test.batchCode,
      value: getNumericMetric(test as Record<string, unknown>, "storabilityPct") ?? 0,
    }))
    .filter((point) => typeof point.value === "number");

  const recentBatches: RecentBatchRow[] = batches.map((batch) => ({
    id: batch.id,
    batch: batch.batchCode,
    formula: batch.formulationCode,
    date: batch.dateMixed ? formatDate(new Date(batch.dateMixed)) : "n/a",
    status: mapStatus(batch.status),
  }));

  const complianceSummary: { standard: string; status: string }[] = [];

  return {
    metrics,
    recoveryTrend,
    storabilityTrend,
    recentBatches,
    pendingUsers,
    complianceSummary,
  };
});
