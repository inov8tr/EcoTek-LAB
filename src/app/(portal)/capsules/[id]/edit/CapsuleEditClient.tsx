"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CapsuleFormulaEditor } from "@/components/capsules/CapsuleFormulaEditor";

type Material = { materialName: string; percentage: number };

type CapsuleEditClientProps = {
  capsuleId: string;
  initialName: string;
  initialDescription?: string | null;
  initialMaterials: Material[];
};

export function CapsuleEditClient({
  capsuleId,
  initialName,
  initialDescription,
  initialMaterials,
}: CapsuleEditClientProps) {
  const router = useRouter();

  async function handleSubmit(payload: {
    name: string;
    description?: string;
    materials: Material[];
  }) {
    const res = await fetch(`/api/capsules/${capsuleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description ?? "",
        materials: payload.materials,
      }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.push("/login" as Route);
        return;
      }
      console.error("Failed to update capsule", await res.text());
      return;
    }

    router.push(`/capsules/${capsuleId}` as Route);
  }

  return (
    <CapsuleFormulaEditor
      initialName={initialName}
      initialDescription={initialDescription ?? ""}
      initialMaterials={initialMaterials}
      onSubmit={handleSubmit}
      submitLabel="Update Capsule"
    />
  );
}
