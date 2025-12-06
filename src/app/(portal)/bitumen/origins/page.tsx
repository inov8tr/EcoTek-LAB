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
          <Button asChild className="rounded-full">
            <Link href={"/bitumen/origins/new" as Route}>Add Origin</Link>
          </Button>
        </ViewModeGate>
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
