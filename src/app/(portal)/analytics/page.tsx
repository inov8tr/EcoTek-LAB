import { getStorageStabilityTrend, getRecoveryVsReagent, getEcoCapVsSofteningPoint, getPgImprovementByBitumenSource } from "@/lib/analytics/pma";
import { StorageStabilityTrend } from "@/components/analytics/StorageStabilityTrend";
import { RecoveryVsReagent } from "@/components/analytics/RecoveryVsReagent";
import { EcoCapVsSofteningPoint } from "@/components/analytics/EcoCapVsSofteningPoint";
import { PgScatterPlot } from "@/components/analytics/PgScatterPlot";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Route } from "next";
import { callPython } from "@/lib/python-client";

export default async function AnalyticsPage() {
  const [stability, recovery, ecoCapSoftening, pgImprovement] = await Promise.all([
    getStorageStabilityTrend(),
    getRecoveryVsReagent(),
    getEcoCapVsSofteningPoint(),
    getPgImprovementByBitumenSource(),
  ]);
  let pythonPgResult: { pg_high?: number; pg_low?: number; consistent?: boolean } | null = null;
  if (process.env.PYTHON_API_URL) {
    try {
      pythonPgResult = await callPython("/analytics/pg-grade", {
        capsule_pct: 12,
        reagent_pct: 1,
        dsr_original: { gstar: 1.2, phase_angle: 68 },
        dsr_rtfo: { gstar: 1.4, phase_angle: 70 },
        dsr_pav: { gstar: 3.5, phase_angle: 50 },
      });
    } catch (error) {
      console.error("Python PG grade call failed", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Analytics</h1>
        <p className="text-[var(--color-text-muted)]">
          Cross-formula insights for storage stability, recovery, PG performance, and viscosity.
        </p>
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" asChild>
          <Link href={"/analytics/export" as Route} aria-label="Export analytics source data as CSV">
            Export source data
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StorageStabilityTrend data={stability} />
        <RecoveryVsReagent data={recovery} />
        <EcoCapVsSofteningPoint data={ecoCapSoftening} />
        <PgScatterPlot
          data={pgImprovement.map((row) => ({
            pgHigh: row.deltaHigh,
            pgLow: row.deltaLow,
            label: row.originId,
          }))}
        />
      </div>

      <DashboardCard title="Notes">
        <p className="text-sm text-[var(--color-text-muted)]">
          Analytics are derived from recorded PMA batches and base tests. Ensure data completeness for
          accurate trends.
        </p>
        {pythonPgResult && (
          <div className="mt-3 rounded-lg bg-[var(--color-bg-alt)] p-3 text-sm text-[var(--color-text-heading)]">
            <div className="font-semibold">Python engine PG grade</div>
            <div className="text-[var(--color-text-muted)]">
              PG High: {pythonPgResult.pg_high ?? "n/a"} · PG Low: {pythonPgResult.pg_low ?? "n/a"} ·{" "}
              {pythonPgResult.consistent ? "Consistent" : "Review"}
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
