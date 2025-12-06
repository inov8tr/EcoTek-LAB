import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import type { Route } from "next";

export default async function CapsulesPage() {
  const capsules = await prisma.capsuleFormula.findMany({
    include: {
      materials: { orderBy: { createdAt: "asc" } },
      pmaFormulas: true,
    },
    orderBy: { createdAt: "desc" },
  });

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
        {capsules.map((capsule) => (
          <DashboardCard
            key={capsule.id}
            title={capsule.name}
            description={capsule.description ?? "No description provided."}
            footer={
              <div className="flex items-center justify-between text-xs">
                <span>{capsule.materials.length} materials</span>
                <Link
                  href={`/capsules/${capsule.id}` as Route}
                  className="font-semibold text-[var(--color-text-link)]"
                >
                  View details
                </Link>
              </div>
            }
          >
            <ul className="text-sm text-[var(--color-text-main)]">
              {capsule.materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span>{m.materialName}</span>
                  <span className="font-semibold">{m.percentage}%</span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
