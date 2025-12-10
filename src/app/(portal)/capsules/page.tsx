import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { ArchiveButton } from "@/components/capsules/ArchiveButton";
import type { Route } from "next";

export default async function CapsulesPage() {
  const capsules = await prisma.capsuleFormula.findMany({
    include: {
      pmaFormulas: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const active = capsules.filter((c) => !c.archived);
  const archived = capsules.filter((c) => c.archived);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Capsule Formulas</h1>
          <p className="text-[var(--color-text-muted)]">
            Manage EcoTek capsule definitions and their material breakdowns.
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
            <Link href={"/capsules/new" as Route}>Create Capsule</Link>
          </Button>
        </ViewModeGate>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {active.map((capsule) => (
          <DashboardCard
            key={capsule.id}
            title={capsule.name}
            description={capsule.description ?? "No description provided."}
            footer={
              <div className="flex items-center justify-between text-xs">
                <span>{capsule.pmaFormulas.length} PMA formulas</span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/capsules/${capsule.id}` as Route}
                    className="font-semibold text-[var(--color-text-link)]"
                  >
                    View details
                  </Link>
                  <ViewModeGate
                    minRole="RESEARCHER"
                    fallback={<span className="text-[var(--color-text-muted)]">Archive</span>}
                  >
                    <ArchiveButton capsuleId={capsule.id} />
                  </ViewModeGate>
                </div>
              </div>
            }
          >
            <p className="text-sm text-[var(--color-text-muted)]">Materials not tracked in this build.</p>
          </DashboardCard>
        ))}
      </div>

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">Archived</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {archived.map((capsule) => (
              <DashboardCard
                key={capsule.id}
                title={capsule.name}
                description={capsule.description ?? "No description provided."}
                footer={
                  <div className="flex items-center justify-between text-xs">
                    <span>{capsule.pmaFormulas.length} PMA formulas</span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/capsules/${capsule.id}` as Route}
                        className="font-semibold text-[var(--color-text-link)]"
                      >
                        View details
                      </Link>
                      <ArchiveButton capsuleId={capsule.id} mode="restore" />
                    </div>
                  </div>
                }
              >
                <p className="text-xs text-muted-foreground">Archived</p>
              </DashboardCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
