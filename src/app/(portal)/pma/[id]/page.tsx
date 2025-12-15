import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { dbQuery } from "@/lib/db-proxy";

type PageProps = { params: Promise<{ id: string }> };

type PmaDetail = {
  id: string;
  name: string | null;
  bitumenGradeOverride: string | null;
  ecoCapPercentage: number | null;
  reagentPercentage: number | null;
  mixRpm: number | null;
  mixTimeMinutes: number | null;
  pmaTargetPgHigh: number | null;
  pmaTargetPgLow: number | null;
  capsuleFormula: { id: string; name: string | null; materials: any[] } | null;
  bitumenOrigin: { refineryName: string | null } | null;
};

export default async function PmaDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const pma = await fetchPma(id);

  if (!pma) {
    notFound();
  }
  const batches = await loadBatches(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">
            {pma.name ?? pma.bitumenGradeOverride ?? "PMA Formula"}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Capsule: {pma.capsuleFormula?.name ?? "N/A"} · Origin:{" "}
            {pma.bitumenOrigin?.refineryName ?? "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/pma/${pma.id}/edit` as Route}
            className="text-sm font-semibold text-[var(--color-text-link)]"
          >
            Edit
          </Link>
          <Link href={"/pma" as Route} className="text-sm font-semibold text-[var(--color-text-link)]">
            Back to list
          </Link>
        </div>
      </div>

      <DashboardCard title="Mix Parameters">
        <div className="grid gap-3 text-sm text-[var(--color-text-main)] md:grid-cols-2">
          <Metric label="EcoCap %" value={pma.ecoCapPercentage} />
          <Metric label="Reagent %" value={pma.reagentPercentage} />
          <Metric label="Mix RPM" value={pma.mixRpm} />
          <Metric label="Mix Time (min)" value={pma.mixTimeMinutes} />
          <Metric label="Target PG High" value={pma.pmaTargetPgHigh} />
          <Metric label="Target PG Low" value={pma.pmaTargetPgLow} />
        </div>
      </DashboardCard>

      <DashboardCard title="Batches">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">{batches.length} batches</p>
          <Link
            href={`/pma/${pma.id}/batches/new` as Route}
            className="text-sm font-semibold text-[var(--color-text-link)]"
          >
            Add batch
          </Link>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
          {batches.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-white/70 px-3 py-2"
            >
              <div>
                <p className="font-semibold">{b.batchCode}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Tests: {b.testCount ?? 0}
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

function Metric({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-white/70 px-3 py-2">
      <p className="text-[var(--color-text-muted)] text-xs">{label}</p>
      <p className="text-[var(--color-text-heading)] font-semibold">{value ?? "—"}</p>
    </div>
  );
}

async function fetchPma(id: string): Promise<PmaDetail | null> {
  const baseUrl = process.env.DB_API_URL;
  const apiKey = process.env.DB_API_KEY || process.env.X_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("DB_API_URL/DB_API_KEY must be configured");
  }

  const res = await fetch(`${baseUrl}/db/pma-formulas/${id}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`DB API error ${res.status}`);
  }
  return (await res.json()) as PmaDetail;
}

async function loadBatches(id: string) {
  return dbQuery<{
    id: string;
    batchCode: string | null;
    testCount: string | number | null;
  }>(
    [
      'SELECT b."id", b."batchCode",',
      '  (SELECT COUNT(*)::int FROM "PmaTestResult" tr WHERE tr."pmaBatchId" = b."id") AS "testCount"',
      'FROM "PmaBatch" b',
      'WHERE b."pmaFormulaId" = $1',
      'ORDER BY b."createdAt" DESC',
    ].join(" "),
    [id],
  );
}
