import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";

type PageProps = { params: { id: string } };

export default async function BitumenOriginDetail({ params }: PageProps) {
  const origin = await prisma.bitumenOrigin.findUnique({
    where: { id: params.id },
    include: { baseTests: { orderBy: { createdAt: "desc" } }, pmaFormulas: true },
  });

  if (!origin) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">
            {origin.refineryName}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Binder: {origin.binderGrade} · Country: {origin.originCountry || "N/A"}
          </p>
        </div>
        <Link
          href={"/bitumen/origins" as Route}
          className="text-sm font-semibold text-[var(--color-text-link)]"
        >
          Back to list
        </Link>
      </div>

      <DashboardCard title="Description">
        <p className="text-sm text-[var(--color-text-main)]">
          {origin.description || "No description provided."}
        </p>
      </DashboardCard>

      <DashboardCard title="Base Binder Tests" description="Baseline performance for this origin.">
        {origin.baseTests.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No tests recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
            {origin.baseTests.map((test) => (
              <li
                key={test.id}
                className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-white/70 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{test.batchCode}</span>
                  <Link
                    href={`/bitumen/tests/${test.id}` as Route}
                    className="text-[var(--color-text-link)] font-semibold"
                  >
                    View test
                  </Link>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Softening: {test.softeningPoint ?? "—"} · PG: {test.basePgHigh ?? "—"}/
                  {test.basePgLow ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
