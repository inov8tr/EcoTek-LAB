import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/ui/chart-card";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { ScatterTrendChart } from "@/components/charts/scatter-trend-chart";
import { RadarComplianceChart } from "@/components/charts/radar-compliance-chart";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFormulationDetailData } from "@/lib/data-service";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { getCurrentUser } from "@/lib/auth-helpers";
import { archiveFormulation, restoreFormulation } from "@/app/actions/archive";
import { formatDate } from "@/lib/utils";

const requirementLabels: Record<string, string> = {
  storabilityPct: "Storability",
  elasticRecoveryPct: "Elastic Recovery",
  jnr_3_2: "Jnr 3.2 kPa",
  softeningPointC: "Softening Point",
  ductilityCm: "Ductility",
  viscosity155c: "Viscosity 155°C",
};

export default async function FormulationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [detail, currentUser] = await Promise.all([
    getFormulationDetailData(params.id),
    getCurrentUser(),
  ]);
  if (!detail) {
    notFound();
  }
  const isAdmin = currentUser?.role === "ADMIN";
  const compliance = detail.compliance.map((entry) => ({
    metric: requirementLabels[entry.metric] ?? entry.metric,
    value: entry.value,
    requirement: entry.requirement,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/formulations"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-link)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Formulations
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">
            Formula {detail.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {detail.archived && (
              <span className="rounded-full bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Archived {detail.archivedAt ? formatDate(new Date(detail.archivedAt)) : ""}
              </span>
            )}
            <Button variant="secondary" className="gap-2 bg-white">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            {isAdmin && (
              <ViewModeGate minRole="ADMIN">
                <form action={detail.archived ? restoreFormulation : archiveFormulation}>
                  <input type="hidden" name="slug" value={detail.id} />
                  <Button
                    variant="ghost"
                    type="submit"
                    className="text-sm text-[var(--color-text-link)] hover:underline"
                  >
                    {detail.archived ? "Restore formulation" : "Archive formulation"}
                  </Button>
                </form>
              </ViewModeGate>
            )}
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Formula</p>
            <p className="text-lg font-semibold text-[var(--color-text-heading)]">
              {detail.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">EcoCap Content</p>
            <p className="text-lg font-semibold text-[var(--color-text-heading)]">
              {detail.ecoCap ?? "—"}%
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Reagent Content</p>
            <p className="text-lg font-semibold text-[var(--color-text-heading)]">
              {detail.reagent ?? "—"}%
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Bitumen Grade</p>
            <p className="text-lg font-semibold text-[var(--color-text-heading)]">
              {detail.bitumen ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Elastic Recovery Across Batches"
          description="Recovery percentage per batch"
          className="lg:col-span-2"
        >
          <LineTrendChart
            data={detail.recoveryTrend}
            xKey="batch"
            lines={[
              {
                dataKey: "recovery",
                color: "var(--color-accent-recovery)",
                name: "Recovery %",
              },
            ]}
            yDomain={[70, 100]}
          />
        </ChartCard>

        <ChartCard
          title="Storability vs Reagent %"
          description="Relationship analysis"
        >
          <ScatterTrendChart
            data={detail.storabilityVsReagent}
            xKey="reagent"
            yKey="storability"
            xLabel="Reagent %"
            yLabel="Storability %"
            referenceLine={5}
          />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Korean Compliance Radar"
          description="Live formulation vs PMA requirements"
        >
          <RadarComplianceChart
            data={compliance}
            metricKey="metric"
            valueKey="value"
            requirementKey="requirement"
          />
        </ChartCard>

        <ChartCard
          title="Recent Batch Results"
          description="Measurements captured during QA"
        >
          <DataTable
            data={detail.batchResults}
            columns={[
              { key: "batch", header: "Batch" },
              { key: "recovery", header: "Recovery %", render: (row) => `${row.recovery}%` },
              { key: "storability", header: "Storability %", render: (row) => `${row.storability}%` },
              { key: "jnr", header: "Jnr", render: (row) => `${row.jnr} kPa⁻¹` },
              { key: "softening", header: "Softening °C", render: (row) => `${row.softening}°C` },
              { key: "ductility", header: "Ductility cm", render: (row) => `${row.ductility} cm` },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
            ]}
          />
        </ChartCard>
      </section>
    </div>
  );
}
