import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import type { BinderTestExtractedData } from "@/lib/binder/types";
import { Analytics } from "@/lib/analytics";

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

      <Section title="Performance Grade" fields={performance} />
      <Section title="Basic Physical Properties" fields={physical} />
      <Section title="DSR (High Temperature)" fields={dsr} />
      <Section title="BBR (Low Temperature)" fields={bbr} />
      <Section title="MSCR" fields={mscr} />
      <Section title="Metadata" fields={meta} />

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
