import {
  getStorageStabilityTrend,
  getRecoveryVsReagent,
  getEcoCapVsSofteningPoint,
  getPgImprovementByBitumenSource,
  getViscosityCurves,
  getSofteningPointStability,
  getPgHighLowMap,
  getDsrTrendSeries,
} from "@/lib/analytics/pma";
import { StorageStabilityTrend } from "@/components/analytics/StorageStabilityTrend";
import { RecoveryVsReagent } from "@/components/analytics/RecoveryVsReagent";
import { EcoCapVsSofteningPoint } from "@/components/analytics/EcoCapVsSofteningPoint";
import { PgScatterPlot } from "@/components/analytics/PgScatterPlot";
import { ViscosityCurves } from "@/components/analytics/ViscosityCurves";
import { SofteningPointStability } from "@/components/analytics/SofteningPointStability";
import { PgHighLowMap } from "@/components/analytics/PgHighLowMap";
import { DsrTrend } from "@/components/analytics/DsrTrend";
import { DashboardCard } from "@/components/ui/dashboard-card";

export default async function AnalyticsPage() {
  const [
    stability,
    recovery,
    ecoCapSoftening,
    pgImprovement,
    viscosity,
    softeningStability,
    pgMap,
    dsrTrend,
  ] =
    await Promise.all([
      getStorageStabilityTrend(),
      getRecoveryVsReagent(),
      getEcoCapVsSofteningPoint(),
      getPgImprovementByBitumenSource(),
      getViscosityCurves(),
      getSofteningPointStability(),
      getPgHighLowMap(),
      getDsrTrendSeries(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Analytics</h1>
        <p className="text-[var(--color-text-muted)]">
          Cross-formula insights for storage stability, recovery, PG performance, viscosity, and softening trends.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StorageStabilityTrend data={stability} />
        <SofteningPointStability data={softeningStability} />
        <RecoveryVsReagent data={recovery} />
        <EcoCapVsSofteningPoint data={ecoCapSoftening} />
        <PgScatterPlot
          data={pgImprovement.map((row: { deltaHigh: number; deltaLow: number; originId: string | null }) => ({
            pgHigh: row.deltaHigh,
            pgLow: row.deltaLow,
            label: row.originId ?? "",
          }))}
        />
        <ViscosityCurves data={viscosity} />
        <PgHighLowMap data={pgMap} />
        <DsrTrend data={dsrTrend} />
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
