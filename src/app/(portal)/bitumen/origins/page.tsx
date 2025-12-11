import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import type { Route } from "next";

export default async function BitumenOriginsPage() {
  const origins = await prisma.bitumenOrigin.findMany({
    include: { baseTests: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Bitumen Origins</h1>
          <p className="text-[var(--color-text-muted)]">
            Track refinery sources and baseline bitumen properties.
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
            <Link href={"/bitumen/origins/new" as Route}>Add Origin</Link>
          </Button>
        </ViewModeGate>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">All origins</h2>
        </div>
        {origins.length === 0 ? (
          <div className="p-4 text-sm text-[var(--color-text-muted)]">
            No origins added yet. Use the button above to add the first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="border-b border-neutral-200 px-4 py-2 font-medium uppercase tracking-wide text-xs">
                    Refinery
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-2 font-medium uppercase tracking-wide text-xs">
                    Binder Grade
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-2 font-medium uppercase tracking-wide text-xs">
                    Base Tests
                  </th>
                  <th className="border-b border-neutral-200 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {origins.map((origin) => (
                  <tr key={`table-${origin.id}`} className="border-b border-neutral-100">
                    <td className="px-4 py-3 text-neutral-900">{origin.refineryName}</td>
                    <td className="px-4 py-3 text-neutral-700">{origin.binderGrade ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-700">{origin.baseTests.length}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/bitumen/origins/${origin.id}` as Route}>Open</Link>
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
        {origins.map((origin) => (
          <DashboardCard
            key={origin.id}
            title={origin.refineryName}
            description={origin.description || origin.originCountry || "No description"}
            footer={
              <div className="flex items-center justify-between text-xs">
                <span>{origin.baseTests.length} base tests</span>
                <Link
                  href={`/bitumen/origins/${origin.id}` as Route}
                  className="font-semibold text-[var(--color-text-link)]"
                >
                  View details
                </Link>
              </div>
            }
          >
            <p className="text-sm text-[var(--color-text-main)]">Binder: {origin.binderGrade}</p>
            {origin.originCountry && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Country: {origin.originCountry}
              </p>
            )}
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
