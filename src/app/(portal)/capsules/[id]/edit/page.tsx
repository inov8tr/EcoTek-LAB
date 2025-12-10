import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CapsuleEditClient } from "./CapsuleEditClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCapsulePage({ params }: PageProps) {
  const { id } = await params;
  const capsule = await prisma.capsuleFormula.findUnique({
    where: { id },
  });

  if (!capsule) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Edit Capsule</h1>
        <p className="text-[var(--color-text-muted)]">
          Update capsule metadata and material percentages.
        </p>
      </div>
      <CapsuleEditClient
        capsuleId={id}
        initialName={capsule.name}
        initialDescription={capsule.description}
        initialMaterials={[]}
      />
    </div>
  );
}
