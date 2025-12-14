import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { gatewayTimeline, spotlightTasks } from "@/lib/data";
import { getDatabaseStatus } from "@/lib/db";
import { getDashboardData } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getPythonStatus } from "@/lib/services/python";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const [dbStatus, pythonStatus] = await Promise.all([
    getDatabaseStatus(),
    getPythonStatus(),
  ]);
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="space-y-10">
      <section className="rounded-md border border-brand-primary/30 bg-brand-primary/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.6em] text-[var(--color-text-muted)]">
              EcoTek Control Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--color-text-heading)] md:text-4xl">
              Eco API Gateway
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--color-text-main)]">
              Monitor live sync health, approve formulation changes, and keep every analytics
              workload aligned with sustainability targets.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-medium text-[var(--color-text-heading)]">
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700">
              Real-time Sync On
            </span>
            <span className="rounded-full border border-border px-4 py-2">
              6 Active Pipelines
            </span>
            <StatusPill label="PostgreSQL" healthy={dbStatus.connected} />
            <StatusPill label="Python OCR" healthy={pythonStatus.connected} />
          </div>
        </div>
      </section>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}

async function DashboardData({ isAdmin }: { isAdmin: boolean }) {
  const { metrics, recoveryTrend, storabilityTrend, recentBatches, pendingUsers, complianceSummary } =
    await getDashboardData();

  return (
    <>
      <section className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
        {isAdmin && (
          <ChartCard title="Pending approvals" description="Accounts awaiting admin activation">
            <div className="flex items-baseline justify-between">
              <p className="text-4xl font-semibold text-[var(--color-text-heading)]">{pendingUsers}</p>
              <Link
                href={"/admin/users" as Route}
                className="text-sm font-semibold text-[var(--color-text-link)] underline-offset-4 hover:underline"
              >
                Review
              </Link>
            </div>
          </ChartCard>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Elastic Recovery Trend"
          description="Recovery percentage across recent batches"
        >
          <LineTrendChart
            data={recoveryTrend.map((datum) => ({
              batch: datum.batch,
              recovery: datum.value,
            }))}
            xKey="batch"
            lines={[{ dataKey: "recovery", color: "var(--color-accent-recovery)", name: "Recovery %" }]}
            yDomain={[70, 100]}
          />
        </ChartCard>

        <ChartCard
          title="Storability Trend"
          description="Separation percentage (5% limit shown)"
        >
          <LineTrendChart
            data={storabilityTrend.map((datum) => ({
              batch: datum.batch,
              storability: datum.value,
            }))}
            xKey="batch"
            lines={[
              { dataKey: "storability", color: "var(--color-accent-storability)", name: "Storability %" },
            ]}
            yDomain={[0, 8]}
            references={[
              {
                y: 5,
                label: "5% Limit",
                color: "var(--color-accent-durability)",
              },
            ]}
          />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <ChartCard title="Gateway Timeline" description="Deployments and sync status for today">
          <ul className="space-y-5">
            {gatewayTimeline.map((event) => (
              <li
                key={event.title}
                className="flex items-start gap-4 rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {event.time}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-[var(--color-text-heading)]">{event.title}</p>
                  <p className="text-sm text-[var(--color-text-main)]">{event.detail}</p>
                </div>
                <StatusBadge status={event.state} />
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Operator Spotlight" description="Workflows needing review">
          <div className="space-y-4">
            {spotlightTasks.map((task) => (
              <article
                key={task.title}
                className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
                  {task.badge}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-text-heading)]">
                  {task.title}
                </p>
                <p className="text-sm text-[var(--color-text-main)]">{task.detail}</p>
                <p className="mt-2 text-xs font-semibold text-amber-600">{task.eta}</p>
              </article>
            ))}
          </div>
        </ChartCard>
      </section>

      {complianceSummary.length > 0 && (
        <ChartCard title="Compliance snapshot" description="Latest test status across configured standards">
          <div className="grid gap-3 md:grid-cols-3">
            {complianceSummary.map((item: { standard: string; status: string }) => (
              <div key={item.standard} className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-[var(--color-text-heading)]">{item.standard}</p>
                <div className="mt-2">
                  <StatusBadge status={item.status === "pending" ? "on-track" : (item.status as "pass" | "fail")} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      <ChartCard title="Recent Batches" description="Latest batch results and compliance status">
        <DataTable
          columns={[
            { key: "batch", header: "Batch" },
            { key: "formula", header: "Formula" },
            { key: "date", header: "Date Mixed" },
            {
              key: "status",
              header: "Status",
              render: (item) => <StatusBadge status={item.status} />,
            },
          ]}
          data={recentBatches}
        />
      </ChartCard>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, idx) => (
          <div
            key={`metric-skeleton-${idx}`}
            className="h-32 rounded-md border border-border bg-[var(--color-bg-alt)] animate-pulse"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, idx) => (
          <div
            key={`chart-skeleton-${idx}`}
            className="h-80 rounded-md border border-border bg-[var(--color-bg-alt)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  healthy,
  healthyLabel = "Connected",
  unhealthyLabel = "Offline",
}: {
  label: string;
  healthy: boolean;
  healthyLabel?: string;
  unhealthyLabel?: string;
}) {
  const base = "rounded-full px-4 py-2 border";
  const healthyClasses =
    "bg-[var(--color-status-pass-bg)] text-[var(--color-status-pass-text)] border-[var(--color-status-pass-bg)]";
  const unhealthyClasses =
    "bg-[var(--color-status-fail-bg)] text-[var(--color-status-fail-text)] border-[var(--color-status-fail-bg)]";
  return (
    <span className={`${base} ${healthy ? healthyClasses : unhealthyClasses}`}>
      {label}: {healthy ? healthyLabel : unhealthyLabel}
    </span>
  );
}
