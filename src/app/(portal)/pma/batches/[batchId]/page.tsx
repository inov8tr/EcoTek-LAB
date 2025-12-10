import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";

type PageProps = { params: { batchId: string } };

export default async function PmaBatchDetailPage({ params }: PageProps) {
  const batch = await prisma.pmaBatch.findUnique({
    where: { id: params.batchId },
    include: { pmaFormula: true },
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
        <p className="text-sm text-[var(--color-text-muted)]">Test results are not tracked in this build.</p>
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
