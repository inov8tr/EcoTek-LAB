import { getStorageStabilityTrend, getRecoveryVsReagent, getEcoCapVsSofteningPoint, getPgImprovementByBitumenSource } from "@/lib/analytics/pma";
import { StorageStabilityTrend } from "@/components/analytics/StorageStabilityTrend";
import { RecoveryVsReagent } from "@/components/analytics/RecoveryVsReagent";
import { EcoCapVsSofteningPoint } from "@/components/analytics/EcoCapVsSofteningPoint";
import { PgScatterPlot } from "@/components/analytics/PgScatterPlot";
import { DashboardCard } from "@/components/ui/dashboard-card";

export default async function AnalyticsPage() {
  const [stability, recovery, ecoCapSoftening, pgImprovement] = await Promise.all([
    getStorageStabilityTrend(),
    getRecoveryVsReagent(),
    getEcoCapVsSofteningPoint(),
    getPgImprovementByBitumenSource(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Analytics</h1>
        <p className="text-[var(--color-text-muted)]">
          Cross-formula insights for storage stability, recovery, PG performance, and viscosity.
        </p>
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
      </DashboardCard>
    </div>
  );
}
