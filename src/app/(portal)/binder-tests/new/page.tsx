import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { BinderTestForm } from "@/components/binder/BinderTestForm";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function NewBinderTestPage() {
  await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  const pmaOptions = await prisma.pmaFormula.findMany({
    select: { id: true, name: true, bitumenGradeOverride: true, capsuleFormula: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Binder Test</h1>
        <p className="text-sm text-muted-foreground">
          Create a new binder test entry and upload the associated PDF reports, photos, and videos.
        </p>
      </div>
      <BinderTestForm
        pmaOptions={pmaOptions.map((pma) => ({
          id: pma.id,
          label: pma.name ?? pma.bitumenGradeOverride ?? pma.capsuleFormula?.name ?? `PMA ${pma.id.slice(0, 6)}`,
        }))}
      />
    </div>
  );
}
