import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";

type PageProps = { params: { id: string } };

export default async function PmaBatchesPage({ params }: PageProps) {
  const pma = await prisma.pmaFormula.findUnique({
    where: { id: params.id },
    include: { batches: { orderBy: { createdAt: "desc" } } },
  });

  if (!pma) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{pma.bitumenGradeOverride ?? "PMA Batches"}</h1>
          <p className="text-[var(--color-text-muted)]">
            {pma.batches.length} batches linked to this PMA.
          </p>
        </div>
        <Link
          href={`/pma/${pma.id}/batches/new` as Route}
          className="text-sm font-semibold text-[var(--color-text-link)]"
        >
          Add batch
        </Link>
      </div>

      <DashboardCard>
        <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
          {pma.batches.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-white/70 px-3 py-2"
            >
              <div>
                <p className="font-semibold">{b.batchCode}</p>
                <p className="text-xs text-[var(--color-text-muted)]">No test results tracked in this build.</p>
              </div>
              <Link
                href={`/pma/batches/${b.id}` as Route}
                className="text-[var(--color-text-link)] font-semibold"
              >
                View batch
              </Link>
            </li>
          ))}
        </ul>
      </DashboardCard>
    </div>
  );
}
