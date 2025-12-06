import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PmaEditClient } from "./PmaEditClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPmaPage({ params }: PageProps) {
  const { id } = await params;
  const [pma, capsules, origins, baseTests] = await Promise.all([
    prisma.pmaFormula.findUnique({
      where: { id },
      include: {
        capsuleFormula: true,
        bitumenOrigin: true,
        bitumenTest: true,
      },
    }),
    prisma.capsuleFormula.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.bitumenOrigin.findMany({
      select: { id: true, refineryName: true },
      orderBy: { refineryName: "asc" },
    }),
    prisma.bitumenBaseTest.findMany({
      select: { id: true, bitumenOriginId: true, batchCode: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!pma) {
    notFound();
  }

  const testOptionsByOrigin = baseTests.reduce<Record<string, { id: string; label: string }[]>>(
    (acc, test) => {
      if (!acc[test.bitumenOriginId]) acc[test.bitumenOriginId] = [];
      acc[test.bitumenOriginId].push({ id: test.id, label: test.batchCode });
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Edit PMA Formula</h1>
        <p className="text-[var(--color-text-muted)]">
          Update capsule/origin selection and mix parameters. Base test is optional.
        </p>
      </div>
      <PmaEditClient
        pmaId={id}
        capsuleOptions={capsules.map((c) => ({ id: c.id, label: c.name }))}
        originOptions={origins.map((o) => ({ id: o.id, label: o.refineryName }))}
        testOptionsByOrigin={testOptionsByOrigin}
        initialData={{
          name: pma.name,
          capsuleFormulaId: pma.capsuleFormulaId,
          bitumenOriginId: pma.bitumenOriginId,
          bitumenTestId: pma.bitumenTestId,
          ecoCapPercentage: pma.ecoCapPercentage,
          reagentPercentage: pma.reagentPercentage,
          mixRpm: pma.mixRpm,
          mixTimeMinutes: pma.mixTimeMinutes,
          targetPgHigh: pma.pmaTargetPgHigh,
          targetPgLow: pma.pmaTargetPgLow,
          bitumenGradeOverride: pma.bitumenGradeOverride,
          notes: pma.notes,
        }}
      />
    </div>
  );
}
