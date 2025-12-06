import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";

export default async function PmaListPage() {
  const formulas = await prisma.pmaFormula.findMany({
    include: {
      capsuleFormula: true,
      bitumenOrigin: true,
      bitumenTest: true,
      batches: true,
    },
    orderBy: { createdAt: "desc" },
  });

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
          <Button asChild className="rounded-full">
            <Link href={"/pma/new" as Route}>Create PMA</Link>
          </Button>
        </ViewModeGate>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {formulas.map((pma) => (
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
    </div>
  );
}
