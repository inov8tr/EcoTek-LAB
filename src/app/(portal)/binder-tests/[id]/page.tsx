import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import type { BinderTestExtractedData } from "@/lib/binder/types";
import { Analytics } from "@/lib/analytics";
import {
  binderSpecConstants,
  getElasticRecoveryLimit,
  getJnrLimit,
  isDuctilityPass,
  isElasticRecoveryPass,
  isJnrPass,
  isSofteningPointPass,
  isViscosityPass,
} from "@/lib/analytics/binder-spec";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type FieldRow = { label: string; value: string | number | null | undefined };

export default async function BinderTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const test = await prisma.binderTest.findUnique({
    where: { id },
  });

  if (!test) {
    return notFound();
  }

  const extracted: Partial<BinderTestExtractedData> = (test.aiExtractedData as any)?.data ?? {};
  const dsrData = (test.dsrData as Record<string, number> | null) ?? null;
  const batchIdInt = Number(test.batchId);
  const linkedTestResult =
    Number.isFinite(batchIdInt) && Number.isInteger(batchIdInt)
      ? await prisma.testResult.findFirst({
          where: { batchId: batchIdInt },
          orderBy: { createdAt: "desc" },
        })
      : null;

  const computedPgHigh = await computePgFromPython({
    currentPgHigh: extracted.pgHigh ?? test.pgHigh,
    dsrData,
  });

  const performance: FieldRow[] = [
    {
      label: "Performance Grade",
      value: extracted.performanceGrade ?? buildPg(extracted.pgHigh ?? test.pgHigh ?? computedPgHigh, test.pgLow),
    },
    { label: "PG High (°C)", value: extracted.pgHigh ?? test.pgHigh ?? computedPgHigh },
    { label: "PG Low (°C)", value: extracted.pgLow ?? test.pgLow },
  ];

  const physical: FieldRow[] = [
    { label: "Flash Point COC (°C)", value: extracted.flashPointCOC_C },
    { label: "Softening Point (°C)", value: extracted.softeningPointC ?? test.softeningPointC },
    { label: "Viscosity @155°C (Pa·s)", value: extracted.viscosity155_PaS },
    { label: "Viscosity @155°C (cP)", value: extracted.viscosity155_cP ?? test.viscosity155_cP },
    { label: "Ductility (cm)", value: extracted.ductilityCm ?? test.ductilityCm },
  ];

  const dsr: FieldRow[] = [
    { label: "Original DSR @82°C (kPa)", value: extracted.dsr_original_82C_kPa },
    { label: "RTFO Mass Change (%)", value: extracted.rtfo_massChange_pct },
    { label: "RTFO DSR @82°C (kPa)", value: extracted.dsr_rtfo_82C_kPa },
    { label: "PAV DSR @34°C (kPa)", value: extracted.dsr_pav_34C_kPa },
  ];

  const bbr: FieldRow[] = [
    { label: "BBR Stiffness @-12°C (MPa)", value: extracted.bbr_stiffness_minus12C_MPa },
    { label: "BBR m-Value @-12°C", value: extracted.bbr_mValue_minus12C },
  ];

  const mscr: FieldRow[] = [
    { label: "MSCR Jnr @3.2 kPa⁻¹", value: extracted.mscr_jnr_3_2_kPa_inv ?? extracted.jnr_3_2 ?? test.jnr_3_2 },
    { label: "MSCR % Recovery @64°C (%)", value: extracted.mscr_percentRecovery_64C_pct },
    { label: "Percent Recovery Overall (%)", value: extracted.mscr_percentRecoveryOverall_pct ?? extracted.recoveryPct ?? test.recoveryPct },
  ];

  const meta: FieldRow[] = [
    { label: "Binder Source", value: test.binderSource },
    { label: "Testing Location", value: extracted.testingLocation },
    { label: "Test Report #", value: extracted.testReportNumber },
    { label: "Sample / Binder Name", value: extracted.sampleName ?? test.name ?? test.binderSource },
    { label: "Test Date", value: extracted.testDate },
    { label: "Lab Name", value: extracted.labName ?? test.lab },
    { label: "Operator", value: test.operator },
    { label: "CRM %", value: test.crmPct },
    { label: "Reagent %", value: test.reagentPct },
    { label: "Aerosil %", value: test.aerosilPct },
    { label: "Batch ID", value: test.batchId },
  ];

  const specRows = buildSpecRows({
    pgHigh: extracted.pgHigh ?? test.pgHigh ?? computedPgHigh ?? null,
    pgLow: extracted.pgLow ?? test.pgLow ?? null,
    jnr: extracted.mscr_jnr_3_2_kPa_inv ?? extracted.jnr_3_2 ?? test.jnr_3_2 ?? null,
    recovery: extracted.mscr_percentRecoveryOverall_pct ?? extracted.recoveryPct ?? test.recoveryPct ?? null,
    softening: extracted.softeningPointC ?? test.softeningPointC ?? null,
    ductility: extracted.ductilityCm ?? test.ductilityCm ?? null,
    viscosity: extracted.viscosity155_cP ?? test.viscosity155_cP ?? null,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Binder Test – View Details</p>
          <h1 className="text-2xl font-semibold tracking-tight">{test.name}</h1>
          <p className="text-sm text-muted-foreground">Created {formatDateTime(test.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          <Badge variant="secondary">{test.status}</Badge>
          <div className="text-xs text-muted-foreground">
            CRM: {test.crmPct ?? "-"}% · Reagent: {test.reagentPct ?? "-"}% · Aerosil: {test.aerosilPct ?? "-"}%
          </div>
        </div>
      </div>

      {specRows.length > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-[var(--color-text-heading)]">Specification checks</div>
            <p className="text-xs text-[var(--color-text-muted)]">Calculated vs. current spec thresholds.</p>
          </div>
          <div className="space-y-2">
            {specRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--color-text-heading)]">{row.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{row.requirement}</div>
                </div>
                <div className="text-right text-sm font-semibold text-[var(--color-text-heading)]">
                  {row.value ?? "—"}{" "}
                  {row.pass === null ? (
                    <span className="text-[var(--color-text-muted)] text-xs">no data</span>
                  ) : row.pass ? (
                    <span className="text-emerald-600 text-xs font-semibold">✅ Pass</span>
                  ) : (
                    <span className="text-red-600 text-xs font-semibold">⚠️ Check</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Section title="Performance Grade" fields={performance} />
      <Section title="Basic Physical Properties" fields={physical} />
      <Section title="DSR (High Temperature)" fields={dsr} />
      <Section title="BBR (Low Temperature)" fields={bbr} />
      <Section title="MSCR" fields={mscr} />
      <Section title="Metadata" fields={meta} />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Storage Stability</h3>
          <ul className="text-sm">
            <li>
              Recovery Variation:{" "}
              {(linkedTestResult as any)?.storageStabilityRecoveryPercent ?? "N/A"}%
            </li>
            <li>G* Variation: {(linkedTestResult as any)?.storageStabilityGstarPercent ?? "N/A"}%</li>
            <li>Jnr Variation: {(linkedTestResult as any)?.storageStabilityJnrPercent ?? "N/A"}%</li>
            <li>Δ Softening: {(linkedTestResult as any)?.deltaSoftening ?? "N/A"}°C</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold">Binder Metrics</h3>
          <ul className="text-sm">
            <li>
              Softening Point:{" "}
              {(linkedTestResult as any)?.softeningPoint ?? test.softeningPointC ?? "N/A"}°C
            </li>
            <li>Viscosity 135°C: {(linkedTestResult as any)?.viscosity135 ?? "N/A"}</li>
            <li>
              Ductility 15°C: {(linkedTestResult as any)?.ductility15 ?? test.ductilityCm ?? "N/A"} cm
            </li>
            <li>Ductility 25°C: {(linkedTestResult as any)?.ductility25 ?? "N/A"} cm</li>
            <li>
              Elastic Recovery: {(linkedTestResult as any)?.recovery ?? test.recoveryPct ?? "N/A"}%
            </li>
            <li>
              PG: {(linkedTestResult as any)?.pgHigh ?? test.pgHigh ?? "?"} -{" "}
              {(linkedTestResult as any)?.pgLow ?? test.pgLow ?? "?"}
            </li>
          </ul>
        </div>
      </div>

      {test.notes && (
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-semibold">Notes</div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{test.notes}</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, fields }: { title: string; fields: FieldRow[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
            <dd className="text-sm text-[var(--color-text-heading)]">{field.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function buildPg(pgHigh?: number | null, pgLow?: number | null) {
  if (pgHigh === null || pgHigh === undefined || pgLow === null || pgLow === undefined) return null;
  return `PG ${pgHigh}-${Math.abs(pgLow)}`;
}

function buildSpecRows(inputs: {
  pgHigh: number | null;
  pgLow: number | null;
  jnr: number | null;
  recovery: number | null;
  softening: number | null;
  ductility: number | null;
  viscosity: number | null;
}) {
  const rows: { label: string; requirement: string; value: number | null; pass: boolean | null }[] = [];

  if (inputs.jnr !== null) {
    const limit = getJnrLimit(inputs.pgHigh ?? undefined, inputs.pgLow ?? undefined);
    rows.push({
      label: "Jnr (64°C, 3.2 kPa)",
      requirement: `≤ ${limit}`,
      value: Number.isFinite(inputs.jnr) ? inputs.jnr : null,
      pass: Number.isFinite(inputs.jnr) ? isJnrPass(inputs.jnr, inputs.pgHigh ?? undefined, inputs.pgLow ?? undefined) : null,
    });
  }

  if (inputs.recovery !== null) {
    const limit = getElasticRecoveryLimit(inputs.pgHigh ?? undefined, inputs.pgLow ?? undefined);
    rows.push({
      label: "Elastic Recovery (%)",
      requirement: `≥ ${limit}`,
      value: Number.isFinite(inputs.recovery) ? inputs.recovery : null,
      pass: Number.isFinite(inputs.recovery)
        ? isElasticRecoveryPass(inputs.recovery, inputs.pgHigh ?? undefined, inputs.pgLow ?? undefined)
        : null,
    });
  }

  if (inputs.softening !== null) {
    rows.push({
      label: "Softening Point (°C)",
      requirement: `≥ ${binderSpecConstants.MIN_SOFTENING_POINT}`,
      value: Number.isFinite(inputs.softening) ? inputs.softening : null,
      pass: Number.isFinite(inputs.softening) ? isSofteningPointPass(inputs.softening) : null,
    });
  }

  if (inputs.ductility !== null) {
    rows.push({
      label: "Ductility @15°C (cm)",
      requirement: `≥ ${binderSpecConstants.MIN_DUCTILITY_15C}`,
      value: Number.isFinite(inputs.ductility) ? inputs.ductility : null,
      pass: Number.isFinite(inputs.ductility) ? isDuctilityPass(inputs.ductility) : null,
    });
  }

  if (inputs.viscosity !== null) {
    rows.push({
      label: "Viscosity (cP)",
      requirement: `≤ ${binderSpecConstants.MAX_VISCOSITY_135_CP} @135°C (pending confirm)`,
      value: Number.isFinite(inputs.viscosity) ? inputs.viscosity : null,
      pass: Number.isFinite(inputs.viscosity) ? isViscosityPass(inputs.viscosity) : null,
    });
  }

  return rows;
}

async function computePgFromPython({
  currentPgHigh,
  dsrData,
}: {
  currentPgHigh?: number | null;
  dsrData: Record<string, number> | null;
}) {
  if (currentPgHigh || !dsrData || !Object.keys(dsrData).length) {
    return currentPgHigh ?? null;
  }

  const temps = Object.keys(dsrData)
    .map((key) => Number(key))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!temps.length) return null;

  const gstar = [];
  for (const temp of temps) {
    const val = dsrData[String(temp)];
    if (typeof val !== "number" || Number.isNaN(val)) {
      return null;
    }
    gstar.push(val);
  }

  const { pg_high: pgHigh } = await Analytics.computePgGrade({
    g_original: gstar[0],
    delta_original: temps[0],
    g_rtfo: gstar[0] * 0.85,
    delta_rtfo: temps[0],
  });
  return pgHigh ?? null;
}
