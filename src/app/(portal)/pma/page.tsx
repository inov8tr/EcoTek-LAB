import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { Filter } from "lucide-react";

export default async function PmaListPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolved = await searchParams;
  const q = resolved?.q?.toString().toLowerCase().trim() ?? "";
  const formulas = await prisma.pmaFormula.findMany({
    include: {
      capsuleFormula: true,
      bitumenOrigin: true,
      bitumenTest: true,
      batches: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const filtered = q
    ? formulas.filter((pma) =>
        `${pma.name ?? ""} ${pma.bitumenGradeOverride ?? ""} ${pma.capsuleFormula?.name ?? ""} ${pma.bitumenOrigin?.refineryName ?? ""}`
          .toLowerCase()
          .includes(q),
      )
    : formulas;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">PMA Formulas</h1>
          <p className="text-[var(--color-text-muted)]">
            Combine capsule formulas with bitumen origins to define PMA candidates.
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
          <Button
            asChild
            variant="secondary"
            className="rounded-full px-5 py-2 shadow-sm border-brand-primary text-brand-primary hover:bg-brand-primary/5"
          >
            <Link href={"/pma/new" as Route}>Create PMA</Link>
          </Button>
        </ViewModeGate>
      </div>

      <form className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2" method="get">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          name="q"
          placeholder="Search PMA or origin"
          defaultValue={q}
          autoComplete="off"
          className="w-64 text-sm outline-none"
        />
        <Button type="submit" variant="secondary" size="sm">
          Apply
        </Button>
        {q && (
          <Link href={"/pma" as Route} className="text-sm text-muted-foreground hover:text-primary">
            Clear
          </Link>
        )}
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          title="No PMA formulas found"
          description="Try a different search term or create a new PMA formula."
          actions={
            <ViewModeGate minRole="RESEARCHER">
              <Button asChild size="sm">
                <Link href={"/pma/new" as Route}>Create PMA</Link>
              </Button>
            </ViewModeGate>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((pma) => (
            <DashboardCard
              key={pma.id}
              title={pma.name ?? pma.bitumenGradeOverride ?? `PMA ${pma.id.slice(0, 6)}`}
              description={pma.notes || "No notes provided."}
              footer={
                <div className="flex items-center justify-between text-xs">
                  <span>{pma.batches.length} batches</span>
                  <Link
                    href={`/pma/${pma.id}` as Route}
                    className="font-semibold text-[var(--color-text-link)]"
                  >
                    View details
                  </Link>
                </div>
              }
            >
              <p className="text-sm text-[var(--color-text-main)]">
                Capsule: {pma.capsuleFormula?.name ?? "N/A"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Origin: {pma.bitumenOrigin?.refineryName ?? "N/A"} · Base Test:{" "}
                {pma.bitumenTest?.batchCode ?? "N/A"}
              </p>
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
