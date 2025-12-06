import Link from "next/link";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Download, Filter } from "lucide-react";
import { getBatchesTable } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth-helpers";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { archiveBatch, restoreBatch } from "@/app/actions/archive";

export default async function BatchesPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const view = resolvedParams?.view === "archived" ? "archived" : "active";
  const q = resolvedParams?.q?.toString().toLowerCase().trim() ?? "";
  const [batches, currentUser] = await Promise.all([
    getBatchesTable({ state: view }),
    getCurrentUser(),
  ]);
  const filtered = q
    ? batches.filter((b) =>
        `${b.batch} ${b.formula} ${b.operator}`.toLowerCase().includes(q),
      )
    : batches;
  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "RESEARCHER";
  const isArchivedView = view === "archived";
  const isAdmin = currentUser?.role === "ADMIN";
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Batches</h1>
          <p className="text-[var(--color-text-muted)]">
            View every production batch and binder test status.
          </p>
        </div>
        {canEdit && (
          <ViewModeGate
            minRole="RESEARCHER"
            fallback={
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                This action is unavailable in Viewer Mode.
              </p>
            }
          >
            <Button asChild className="gap-2 rounded-full">
              <Link href="/batches/new">
                <Plus className="h-4 w-4" />
                New batch
              </Link>
            </Button>
          </ViewModeGate>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/batches"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !isArchivedView
              ? "bg-[var(--color-accent-primary)] text-white"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          Active
        </Link>
        <Link
          href="/batches?view=archived"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            isArchivedView
              ? "bg-[var(--color-accent-primary)] text-white"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          Archived
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2" method="get">
          <input type="hidden" name="view" value={isArchivedView ? "archived" : "active"} />
          <Filter className="h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            name="q"
            placeholder="Search batch or operator"
            defaultValue={q}
            className="w-48 text-sm outline-none"
          />
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
          {q && (
            <Link href={`/batches${isArchivedView ? "?view=archived" : ""}`}>
              <Button type="button" variant="ghost" size="sm">
                Clear
              </Button>
            </Link>
          )}
        </form>
        <div className="ml-auto">
          <Link href={`/api/batches/export?view=${isArchivedView ? "archived" : "active"}`}>
            <Button variant="ghost" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
        </div>
      </div>

      <ChartCard title="All Batches" description="Click a row to review mixing details.">
        <DataTable
          data={filtered}
          columns={[
            { key: "batch", header: "Batch ID" },
            { key: "formula", header: "Formula" },
            { key: "date", header: "Date Mixed" },
            { key: "operator", header: "Operator" },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "action",
              header: "",
              render: (row) => (
                <Link
                  href={`/batches/${row.id}`}
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
                    render: (row: { id: string }) => (
                      <ViewModeGate minRole="ADMIN">
                        <form action={isArchivedView ? restoreBatch : archiveBatch}>
                          <input type="hidden" name="slug" value={row.id} />
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
        />
      </ChartCard>
    </div>
  );
}
