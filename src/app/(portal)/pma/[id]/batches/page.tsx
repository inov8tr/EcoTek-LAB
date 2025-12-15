import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { dbQuery } from "@/lib/db-proxy";

type PageProps = { params: Promise<{ id: string }> };

type PmaFormulaRow = { id: string; name: string | null; bitumenGradeOverride: string | null };
type BatchRow = {
  id: string;
  batchCode: string | null;
  createdAt: string;
  notes: string | null;
  testCount?: string | number | null;
};

export default async function PmaBatchesPage({ params }: PageProps) {
  const { id } = await params;
  const pma = await loadPma(id);
  if (!pma) notFound();

  const batches = await loadBatches(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">
            {pma.bitumenGradeOverride ?? pma.name ?? "PMA Batches"}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {batches.length} batches linked to this PMA.
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
          {batches.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-white/70 px-3 py-2"
            >
              <div>
                <p className="font-semibold">{b.batchCode ?? "Unlabeled batch"}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Tests: {Number(b.testCount ?? 0)}
                </p>
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

async function loadPma(id: string): Promise<PmaFormulaRow | null> {
  const rows = await dbQuery<PmaFormulaRow>(
    'SELECT "id", "name", "bitumenGradeOverride" FROM "PmaFormula" WHERE "id" = $1 LIMIT 1',
    [id],
  );
  return rows[0] ?? null;
}

async function loadBatches(id: string): Promise<BatchRow[]> {
  try {
    return await dbQuery<BatchRow>(
      [
        'SELECT b."id", b."batchCode", b."createdAt", b."notes",',
        '  (SELECT COUNT(*)::int FROM "PmaTestResult" tr WHERE tr."pmaBatchId" = b."id") AS "testCount"',
        'FROM "PmaBatch" b',
        'WHERE b."pmaFormulaId" = $1',
        'ORDER BY b."createdAt" DESC',
      ].join(" "),
      [id],
    );
  } catch (err) {
    console.error("loadBatches", err);
    return [];
  }
}
