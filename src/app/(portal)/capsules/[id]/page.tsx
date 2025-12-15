export const runtime = "nodejs";

import { notFound } from "next/navigation";
import Link from "next/link";
import { dbApi } from "@/lib/dbApi";
import { DashboardCard } from "@/components/ui/dashboard-card";
import type { Route } from "next";

type PageProps = { params: Promise<{ id?: string }> };

type CapsuleDetail = {
  id: string;
  name: string;
  description: string | null;
  materials: { id: string; materialName: string; percentage: number }[];
  pmaFormulas: {
    id: string;
    name: string;
    bitumenGradeOverride: string | null;
    bitumenOrigin: { id: string; refineryName: string; binderGrade: string | null } | null;
    bitumenTest: { id: string; batchCode: string | null } | null;
  }[];
};

export default async function CapsuleDetailPage({ params }: PageProps) {
  const resolved = await params;
  if (!resolved?.id) {
    notFound();
  }

  const capsule = await dbApi<CapsuleDetail>(`/db/capsules/${resolved.id}`);

  if (!capsule) {
    notFound();
  }

  const safeCapsule = {
    ...capsule,
    materials: capsule.materials ?? [],
    pmaFormulas: capsule.pmaFormulas ?? [],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{safeCapsule.name}</h1>
          <p className="text-[var(--color-text-muted)]">
            {safeCapsule.description ?? "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Link
              href={`/capsules/${capsule.id}/edit` as Route}
              className="text-sm font-semibold text-[var(--color-text-link)]"
            >
              Edit
            </Link>
          <Link
            href={"/capsules" as Route}
            className="text-sm font-semibold text-[var(--color-text-link)]"
          >
            Back to list
          </Link>
        </div>
      </div>

      <DashboardCard title="Materials" description="Totals must equal 100%.">
        <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
          {safeCapsule.materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 bg-white/70">
              <span>{m.materialName}</span>
              <span className="font-semibold">{m.percentage}%</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard title="Linked PMA Formulas">
        {safeCapsule.pmaFormulas.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No PMA formulas yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
            {safeCapsule.pmaFormulas.map((pma) => (
              <li
                key={pma.id}
                className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-white/70 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{pma.bitumenGradeOverride ?? "PMA Formula"}</span>
                  <Link
                    href={`/pma/${pma.id}` as Route}
                    className="text-[var(--color-text-link)] font-semibold"
                  >
                    View PMA
                  </Link>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Origin: {pma.bitumenOrigin?.refineryName ?? "N/A"} · Test:{" "}
                  {pma.bitumenTest?.batchCode ?? "N/A"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
