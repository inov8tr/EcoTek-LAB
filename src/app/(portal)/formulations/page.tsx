import Link from "next/link";
import type { Route } from "next";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus } from "lucide-react";
import { getFormulationsTable } from "@/lib/data-service";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { getCurrentUser } from "@/lib/auth-helpers";
import { archiveFormulation, restoreFormulation } from "@/app/actions/archive";

export default async function FormulationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolvedParams = await searchParams;
  const view = resolvedParams?.view === "archived" ? "archived" : "active";
  const [formulations, currentUser] = await Promise.all([
    getFormulationsTable({ state: view }),
    getCurrentUser(),
  ]);
  const isArchivedView = view === "archived";
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Formulations</h1>
          <p className="text-[var(--color-text-muted)]">
            Manage EcoTek formulation recipes and compliance tracking.
          </p>
        </div>
        <ViewModeGate
          minRole="RESEARCHER"
          fallback={
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">
              This action is unavailable in Viewer Mode.
            </p>
          }
        >
          <Button asChild className="gap-2 rounded-full">
            <Link href={"/formulations/new" as Route}>
              <Plus className="h-4 w-4" />
              Create New Formulation
            </Link>
          </Button>
        </ViewModeGate>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/formulations"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !isArchivedView
              ? "bg-[var(--color-accent-primary)] text-white"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          Active
        </Link>
        <Link
          href="/formulations?view=archived"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            isArchivedView
              ? "bg-[var(--color-accent-primary)] text-white"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          Archived
        </Link>
      </div>

      <ChartCard title="All Formulations" description="Click a row to view the detail report.">
        <DataTable
          columns={[
            { key: "code", header: "Name", render: (item) => item.code },
            { key: "ecoCap", header: "EcoCap %", render: (item) => `${item.ecoCap}%` },
            { key: "reagent", header: "Reagent %", render: (item) => `${item.reagent}%` },
            { key: "totalBatches", header: "Total Batches" },
            {
              key: "passRate",
              header: "Avg Pass Rate",
              render: (item) => (
                <span
                  className={
                    item.passRate >= 80 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"
                  }
                >
                  {item.passRate}%
                </span>
              ),
            },
            {
              key: "action",
              header: "",
              render: (item) => (
                <Link
                  href={`/formulations/${item.id}`}
                  className="flex items-center gap-1 text-sm font-semibold text-[var(--color-text-link)]"
                >
                  View
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ),
            },
            ...(isAdmin
              ? [
                  {
                    key: "archive",
                    header: "",
                    render: (item: { id: string }) => (
                      <ViewModeGate minRole="ADMIN">
                        <form action={isArchivedView ? restoreFormulation : archiveFormulation}>
                          <input type="hidden" name="slug" value={item.id} />
                          <Button
                            variant="ghost"
                            type="submit"
                            className="text-xs font-semibold text-[var(--color-text-link)] underline-offset-4 hover:underline"
                          >
                            {isArchivedView ? "Restore" : "Archive"}
                          </Button>
                        </form>
                      </ViewModeGate>
                    ),
                  },
                ]
              : []),
          ]}
          data={formulations}
        />
      </ChartCard>
    </div>
  );
}
