import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";

type PageProps = { params: { batchId: string } };

export default async function PmaBatchDetailPage({ params }: PageProps) {
  const batch = await prisma.pmaBatch.findUnique({
    where: { id: params.batchId },
    include: { pmaFormula: true, testResults: true },
  });

  if (!batch) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{batch.batchCode}</h1>
          <p className="text-[var(--color-text-muted)]">
            Linked PMA: {batch.pmaFormulaId}
          </p>
        </div>
        <Link
          href={`/pma/${batch.pmaFormulaId}/batches` as Route}
          className="text-sm font-semibold text-[var(--color-text-link)]"
        >
          Back to batches
        </Link>
      </div>

      <DashboardCard title="Batch Notes">
        <p className="text-sm text-[var(--color-text-main)]">{batch.notes || "No notes provided."}</p>
      </DashboardCard>

      <DashboardCard title="Test Results">
        {batch.testResults.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No results recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
            {batch.testResults.map((r) => (
              <li
                key={r.id}
                className="grid gap-2 rounded-lg border border-border-subtle bg-white/70 px-3 py-2 md:grid-cols-2 lg:grid-cols-3"
              >
                <Metric label="Softening" value={r.softeningPoint} />
                <Metric label="Viscosity 135" value={r.viscosity135} />
                <Metric label="Viscosity 165" value={r.viscosity165} />
                <Metric label="Ductility" value={r.ductility} />
                <Metric label="Recovery" value={r.elasticRecovery} />
                <Metric label="Storage Stability" value={r.storageStabilityDifference} />
                <Metric label="PG High" value={r.pgHigh} />
                <Metric label="PG Low" value={r.pgLow} />
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <p className="text-[var(--color-text-muted)] text-xs">{label}</p>
      <p className="text-[var(--color-text-heading)] font-semibold">{value ?? "—"}</p>
    </div>
  );
}
