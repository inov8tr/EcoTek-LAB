import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { dbQuery } from "@/lib/db-proxy";

type PageProps = { params: Promise<{ id: string }> };

export default async function BitumenOriginDetail({ params }: PageProps) {
  const { id } = await params;
  const origin = await fetchOrigin(id);

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

type BitumenOriginDetail = {
  id: string;
  refineryName: string;
  binderGrade: string | null;
  originCountry: string | null;
  description: string | null;
  baseTests: {
    id: string;
    batchCode: string | null;
    softeningPoint: number | null;
    basePgHigh: number | null;
    basePgLow: number | null;
    createdAt: string;
  }[];
  pmaFormulas: { id: string; name: string | null; bitumenGradeOverride: string | null }[];
};

async function fetchOrigin(id: string): Promise<BitumenOriginDetail | null> {
  const [origin] = await dbQuery<{
    id: string;
    refineryName: string;
    binderGrade: string | null;
    originCountry: string | null;
    description: string | null;
  }>('SELECT "id", "refineryName", "binderGrade", "originCountry", "description" FROM "BitumenOrigin" WHERE "id" = $1 LIMIT 1', [
    id,
  ]);

  if (!origin) return null;

  const baseTests = await dbQuery<BitumenOriginDetail["baseTests"][number]>(
    [
      'SELECT "id", "batchCode", "softeningPoint", "basePgHigh", "basePgLow", "createdAt"',
      'FROM "BitumenBaseTest"',
      'WHERE "bitumenOriginId" = $1',
      'ORDER BY "createdAt" DESC',
    ].join(" "),
    [id],
  );

  const pmaFormulas = await dbQuery<BitumenOriginDetail["pmaFormulas"][number]>(
    'SELECT "id", "name", "bitumenGradeOverride" FROM "PmaFormula" WHERE "bitumenOriginId" = $1',
    [id],
  );

  return { ...origin, baseTests, pmaFormulas };
}
