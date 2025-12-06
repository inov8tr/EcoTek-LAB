import { unstable_cache } from "next/cache";
import { RequirementComparison, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getPrimaryStandard } from "@/lib/standards";

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

type ComplianceRow = {
  standard: string;
  jnr: PassFail | "pending";
  recovery: PassFail | "pending";
  softening: PassFail | "pending";
  viscosity: PassFail | "pending";
  storability: PassFail | "pending";
  result: PassFail | "pending";
};

const requirementLabels: Record<string, string> = {
  storabilityPct: "Storability",
  elasticRecoveryPct: "Elastic Recovery",
  jnr_3_2: "Jnr 3.2 kPa",
  softeningPointC: "Softening Point",
  ductilityCm: "Ductility",
  viscosity155c: "Viscosity 155°C",
};

const fallbackRequirements: RequirementLookup = {
  solubilityPct: {
    comparison: RequirementComparison.GTE,
    min: 98,
    unit: "%",
  },
};

const binderMetricConfig = [
  { metric: "storabilityPct", label: "Storability %", unit: "%" },
  { metric: "solubilityPct", label: "Solubility %", unit: "%" },
  { metric: "elasticRecoveryPct", label: "Elastic Recovery %", unit: "%" },
  { metric: "softeningPointC", label: "Softening Point", unit: "°C" },
  { metric: "ductilityCm", label: "Ductility", unit: "cm" },
  { metric: "jnr_3_2", label: "Jnr (3.2 kPa)", unit: "kPa⁻¹" },
] as const;

const metricFieldMap: Record<string, string> = {
  jnr_3_2: "jnr",
  viscosity155c: "viscosityPaS",
};

const withStaticCache = <T>(key: string, fn: () => Promise<T>, revalidate = 60) =>
  unstable_cache(fn, [key], { revalidate });

function createCachedFetcher<T extends unknown[], R>(
  key: string,
  fn: (...args: T) => Promise<R>,
  revalidate = 60,
) {
  const memo = new Map<string, () => Promise<R>>();
  return async (...args: T) => {
    const argKey = args.map((arg) => JSON.stringify(arg)).join("|");
    const cacheKey = `${key}:${argKey}`;
    if (!memo.has(cacheKey)) {
      const cachedFn = unstable_cache(
        () => fn(...args),
        [key, cacheKey],
        { revalidate },
      );
      memo.set(cacheKey, cachedFn);
    }
    return memo.get(cacheKey)!();
  };
}

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

function parseMixingCurve(raw: unknown): { minute: number; temperature: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((point) => ({
      minute:
        typeof (point as { minute?: number }).minute === "number"
          ? (point as { minute: number }).minute
          : Number((point as Record<string, unknown>).minute ?? NaN),
      temperature:
        typeof (point as { temperature?: number }).temperature === "number"
          ? (point as { temperature: number }).temperature
          : Number((point as Record<string, unknown>).temperature ?? NaN),
    }))
    .filter(
      (point) => Number.isFinite(point.minute) && Number.isFinite(point.temperature),
    )
    .sort((a, b) => a.minute - b.minute);
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(2));
}

function addSeriesPoint(
  map: Map<string, Record<string, number | string>>,
  batchCode: string,
  formulationCode: string,
  value: number,
) {
  if (!map.has(batchCode)) {
    map.set(batchCode, { batch: batchCode });
  }
  map.get(batchCode)![formulationCode] = Number(value.toFixed(2));
}

export const getDashboardData = withStaticCache("dashboard-data", async () => {
  const [lookup, tests, batches, pendingUsers] = await Promise.all([
    getRequirementLookup(),
    prisma.testResult.findMany({
      where: {
        batch: {
          archived: false,
          formulation: {
            archived: false,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        batch: {
          include: { formulation: true },
        },
      },
    }),
    prisma.batch.findMany({
      where: {
        archived: false,
        formulation: {
          archived: false,
        },
      },
      orderBy: { dateMixed: "desc" },
      take: 6,
      include: { formulation: true },
    }),
    prisma.user.count({ where: { status: UserStatus.PENDING } }),
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
      batch: test.batch.batchCode,
      value: getNumericMetric(test as Record<string, unknown>, "elasticRecoveryPct") ?? 0,
    }))
    .filter((point) => typeof point.value === "number");

  const storabilityTrend: TrendPoint[] = recentWindow
    .map((test) => ({
      batch: test.batch.batchCode,
      value: getNumericMetric(test as Record<string, unknown>, "storabilityPct") ?? 0,
    }))
    .filter((point) => typeof point.value === "number");

  const recentBatches: RecentBatchRow[] = batches.map((batch) => ({
    id: batch.slug,
    batch: batch.batchCode,
    formula: batch.formulation.code,
    date: formatDate(batch.dateMixed),
    status: mapStatus(batch.status),
  }));

  const complianceClient = (prisma as Record<string, any>).complianceResult;
  const complianceSummary =
    latest && complianceClient
      ? await complianceClient
          .findMany({
            where: { testId: latest.id },
            include: { standard: true },
          })
          .then((rows: Array<{ standard: { code: string }; overallPass: boolean | null }>) =>
            rows.map((row) => ({
              standard: row.standard.code,
              status:
                row.overallPass === null
                  ? "pending"
                  : row.overallPass
                  ? "pass"
                  : "fail",
            })),
          )
      : [];

  return {
    metrics,
    recoveryTrend,
    storabilityTrend,
    recentBatches,
    pendingUsers,
    complianceSummary,
  };
});

const fetchFormulationsTable = createCachedFetcher(
  "formulations-table",
  async (state: "active" | "archived" = "active") => {
    const includeArchivedRelations = state === "archived";
    const formulations = await prisma.formulation.findMany({
      where: { archived: state === "archived" },
      orderBy: { code: "asc" },
      include: {
        batches: {
          where: includeArchivedRelations ? undefined : { archived: false },
        },
      },
    });

    return formulations.map((formulation) => {
      const totalBatches = formulation.batches.length;
      const passCount = formulation.batches.filter(
        (batch) => batch.status?.toLowerCase() === "pass",
      ).length;
      const passRate = totalBatches ? Math.round((passCount / totalBatches) * 100) : 0;
      return {
        id: formulation.slug,
        code: formulation.code,
        ecoCap: Number(formulation.ecoCapPercentage ?? 0),
        reagent: Number(formulation.reagentPercentage ?? 0),
        totalBatches,
        passRate,
      };
    });
  },
);

export async function getFormulationsTable(options?: { state?: "active" | "archived" }) {
  const state = options?.state ?? "active";
  return fetchFormulationsTable(state);
}

export const getFormulationDetailData = createCachedFetcher(
  "formulation-detail",
  async (slug: string) => {
    if (!slug) return null;
    const [lookup, formulation] = await Promise.all([
      getRequirementLookup(),
      prisma.formulation.findUnique({
        where: { slug },
        include: {
          batches: {
            where: { archived: false },
            orderBy: { dateMixed: "asc" },
          },
        },
      }),
    ]);

    if (!formulation) return null;

    const recoveryTrend: { batch: string; recovery: number }[] = [];
    const storabilityVsReagent: { reagent: number; storability: number }[] = [];
    const batchResults: {
      batch: string;
      recovery: number;
      storability: number;
      jnr: number;
      softening: number;
      ductility: number;
      status: PassFail;
    }[] = [];

    const requirements = Object.entries(requirementLabels).map(([_, label]) => ({
      metric: label,
      requirement: 0,
      value: 0,
    }));

    return {
      id: formulation.slug,
      name: formulation.name,
      ecoCap: formulation.ecoCapPercentage ?? null,
      reagent: formulation.reagentPercentage ?? null,
      bitumen: formulation.bitumenGrade ?? null,
      archived: formulation.archived,
      archivedAt: formulation.archivedAt?.toISOString() ?? null,
      recoveryTrend,
      storabilityVsReagent,
      compliance: requirements,
      batchResults,
    };
  },
);

const fetchBatchesTable = createCachedFetcher(
  "batches-table",
  async (state: "active" | "archived" = "active") => {
    const batches = await prisma.batch.findMany({
      where: {
        archived: state === "archived",
        ...(state === "archived"
          ? {}
          : {
              formulation: { archived: false },
            }),
      },
      orderBy: { dateMixed: "desc" },
      include: { formulation: true },
    });

    return batches.map((batch) => ({
      id: batch.slug,
      batch: batch.batchCode,
      formula: batch.formulation.code,
      date: formatDate(batch.dateMixed),
      operator: batch.operator ?? "—",
      status: mapStatus(batch.status),
    }));
  },
);

export async function getBatchesTable(options?: { state?: "active" | "archived" }) {
  const state = options?.state ?? "active";
  return fetchBatchesTable(state);
}

export const getBatchDetailData = createCachedFetcher(
  "batch-detail",
  async (slug: string) => {
    if (!slug) return null;
    const [lookup, batch] = await Promise.all([
      getRequirementLookup(),
      prisma.batch.findUnique({
        where: { slug },
        include: {
          formulation: true,
          attachments: {
            orderBy: { createdAt: "desc" },
            include: {
              uploader: {
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    if (!batch) return null;
    const binderTests: { label: string; value: number | string; unit?: string; status: string | null }[] = [];

    return {
      id: batch.slug,
      numericId: batch.id,
      archived: batch.archived,
      archivedAt: batch.archivedAt?.toISOString() ?? null,
      batch: batch.batchCode,
      formulation: batch.formulation.code,
      formulationSlug: batch.formulation.slug,
      date: formatDate(batch.dateMixed),
      operator: batch.operator ?? null,
      status: mapStatus(batch.status),
      rpm: batch.rpm ?? null,
      durationMinutes: batch.mixingDurationMinutes ?? null,
      startTemp: batch.mixingTempInitial ?? null,
      finalTemp: batch.mixingTempFinal ?? null,
      notes: batch.mixingNotes ?? "",
      mixingCurve: parseMixingCurve(batch.mixingCurve),
      binderTests,
      attachments: batch.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: attachment.url,
        createdAt: attachment.createdAt.toISOString(),
        uploader: {
          name: attachment.uploader?.name ?? null,
          email: attachment.uploader?.email ?? null,
        },
      })),
    };
  },
);

export const getAnalyticsData = withStaticCache("analytics-data", async () => {
  const batches = await prisma.batch.findMany({
    where: {
      archived: false,
      formulation: { archived: false },
    },
    orderBy: { dateMixed: "asc" },
    include: {
      formulation: true,
    },
  });

  const formulations = Array.from(
    new Set(batches.map((batch) => batch.formulation.code)),
  ).sort();

  const recoveryMap = new Map<string, Record<string, number | string>>();
  const storabilityMap = new Map<string, Record<string, number | string>>();

  const radarData = Object.entries(requirementLabels).map(([, label]) => ({
    metric: label,
  }));

  return {
    formulations,
    recoveryData: Array.from(recoveryMap.values()),
    storabilityData: Array.from(storabilityMap.values()),
    radarData,
  };
});

function derivePgGrade(test: {
  mscrGrade: string | null;
  softeningPointC: number | null;
}) {
  if (test.mscrGrade) return test.mscrGrade;
  if (typeof test.softeningPointC === "number") {
    return test.softeningPointC >= 80 ? "PG 82-22" : "PG 76-22";
  }
  return "PG TBD";
}

export const getTestDetailData = createCachedFetcher(
  "test-detail",
  async (testIdParam: string | number) => {
    return null;
  },
);
