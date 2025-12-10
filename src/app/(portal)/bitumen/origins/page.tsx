import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { ArchiveOriginButton } from "@/components/bitumen/ArchiveOriginButton";
import type { Route } from "next";

export default async function BitumenOriginsPage() {
  const origins = await prisma.bitumenOrigin.findMany({
    include: { baseTests: true },
    orderBy: { createdAt: "desc" },
  });

  const active = origins.filter((o) => !o.archived);
  const archived = origins.filter((o) => o.archived);

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
          <Button asChild className="rounded-full">
            <Link href={"/bitumen/origins/new" as Route}>Add Origin</Link>
          </Button>
        </ViewModeGate>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {active.map((origin) => (
          <DashboardCard
            key={origin.id}
            title={origin.refineryName}
            description={origin.description || origin.originCountry || "No description"}
            footer={
              <div className="flex items-center justify-between text-xs">
                <span>{origin.baseTests.length} base tests</span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/bitumen/origins/${origin.id}` as Route}
                    className="font-semibold text-[var(--color-text-link)]"
                  >
                    View details
                  </Link>
                  <ViewModeGate
                    minRole="RESEARCHER"
                    fallback={<span className="text-[var(--color-text-muted)]">Archive</span>}
                  >
                    <ArchiveOriginButton originId={origin.id} />
                  </ViewModeGate>
                </div>
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

      {archived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">Archived</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {archived.map((origin) => (
              <DashboardCard
                key={origin.id}
                title={origin.refineryName}
                description={origin.description || origin.originCountry || "No description"}
                footer={
                  <div className="flex items-center justify-between text-xs">
                    <span>{origin.baseTests.length} base tests</span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/bitumen/origins/${origin.id}` as Route}
                        className="font-semibold text-[var(--color-text-link)]"
                      >
                        View details
                      </Link>
                      <ArchiveOriginButton originId={origin.id} mode="restore" />
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
