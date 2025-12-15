export const runtime = "nodejs";

import Link from "next/link";
import { dbApi } from "@/lib/dbApi";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import type { Route } from "next";

type CapsuleFormula = {
  id: string;
  name: string;
  description: string | null;
  materials: { id: string; materialName: string; percentage: number }[];
  pmaCount: number;
};

export default async function CapsulesPage() {
  const capsules = await dbApi<CapsuleFormula[]>("/db/capsules");
  const safeCapsules = capsules.map((capsule) => ({
    ...capsule,
    materials: capsule.materials ?? [],
    pmaCount: capsule.pmaCount ?? 0,
  }));

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
          <Button
            asChild
            className="rounded-full px-5 py-2 shadow-sm bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90"
          >
            <Link href={"/capsules/new" as Route}>Create Capsule</Link>
          </Button>
        </ViewModeGate>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">All formulas</h2>
        </div>
        {safeCapsules.length === 0 ? (
          <div className="p-4 text-sm text-[var(--color-text-muted)]">
            No capsules created yet. Use the button above to add a new formula.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-2 font-medium uppercase tracking-wide text-xs">
                    Name
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-2 font-medium uppercase tracking-wide text-xs">
                    Materials
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-2 font-medium uppercase tracking-wide text-xs">
                    In PMA Formulas
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {safeCapsules.map((capsule) => (
                  <tr key={`table-${capsule.id}`} className="border-b border-neutral-100">
                    <td className="px-4 py-3 text-neutral-900">{capsule.name}</td>
                    <td className="px-4 py-3 text-neutral-700">{capsule.materials.length}</td>
                    <td className="px-4 py-3 text-neutral-700">{capsule.pmaCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/capsules/${capsule.id}` as Route}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {safeCapsules.map((capsule) => (
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
