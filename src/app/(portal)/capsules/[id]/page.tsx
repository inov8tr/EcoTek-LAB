import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/ui/dashboard-card";
import type { Route } from "next";

type PageProps = { params: Promise<{ id?: string }> };

export default async function CapsuleDetailPage({ params }: PageProps) {
  const resolved = await params;
  if (!resolved?.id) {
    notFound();
  }

  const capsule = await prisma.capsuleFormula.findUnique({
    where: { id: resolved.id },
    include: {
      pmaFormulas: {
        include: {
          bitumenOrigin: true,
          bitumenTest: true,
        },
      },
    },
  });

  if (!capsule) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{capsule.name}</h1>
          <p className="text-[var(--color-text-muted)]">
            {capsule.description ?? "No description provided."}
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

      <DashboardCard title="Linked PMA Formulas">
        {capsule.pmaFormulas.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No PMA formulas yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
            {capsule.pmaFormulas.map((pma) => (
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
