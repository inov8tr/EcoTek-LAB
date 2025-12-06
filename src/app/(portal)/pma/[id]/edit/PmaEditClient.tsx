"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { PMAFormulaEditor } from "@/components/pma/PMAFormulaEditor";

type Option = { id: string; label: string };

type PmaEditClientProps = {
  pmaId: string;
  capsuleOptions: Option[];
  originOptions: Option[];
  testOptionsByOrigin: Record<string, Option[]>;
  initialData: {
    name?: string;
    capsuleFormulaId: string;
    bitumenOriginId: string;
    bitumenTestId?: string | null;
    ecoCapPercentage: number;
    reagentPercentage: number;
    mixRpm?: number | null;
    mixTimeMinutes?: number | null;
    targetPgHigh?: number | null;
    targetPgLow?: number | null;
    bitumenGradeOverride?: string | null;
    notes?: string | null;
  };
};

export function PmaEditClient({
  pmaId,
  capsuleOptions,
  originOptions,
  testOptionsByOrigin,
  initialData,
}: PmaEditClientProps) {
  const router = useRouter();

  async function handleSubmit(payload: {
    name: string;
    capsuleFormulaId: string;
    bitumenOriginId: string;
    bitumenTestId?: string | null;
    ecoCapPercentage: number;
    reagentPercentage: number;
    mixRpm?: number;
    mixTimeMinutes?: number;
    targetPgHigh?: number;
    targetPgLow?: number;
    bitumenGradeOverride?: string;
    notes?: string;
  }) {
    const res = await fetch(`/api/pma/${pmaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        bitumenTestId: payload.bitumenTestId ?? null,
      }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.push("/login" as Route);
        return;
      }
      console.error("Failed to update PMA formula", await res.text());
      return;
    }

    router.push(`/pma/${pmaId}` as Route);
  }

  return (
    <PMAFormulaEditor
      capsuleOptions={capsuleOptions}
      originOptions={originOptions}
      testOptionsByOrigin={testOptionsByOrigin}
      initialData={{
        name: initialData.name ?? "",
        capsuleFormulaId: initialData.capsuleFormulaId,
        bitumenOriginId: initialData.bitumenOriginId,
        bitumenTestId: initialData.bitumenTestId ?? null,
        ecoCapPercentage: initialData.ecoCapPercentage,
        reagentPercentage: initialData.reagentPercentage,
        mixRpm: initialData.mixRpm ?? undefined,
        mixTimeMinutes: initialData.mixTimeMinutes ?? undefined,
        targetPgHigh: initialData.targetPgHigh ?? undefined,
        targetPgLow: initialData.targetPgLow ?? undefined,
        bitumenGradeOverride: initialData.bitumenGradeOverride ?? "",
        notes: initialData.notes ?? "",
      }}
      submitLabel="Update PMA Formula"
      onSubmit={handleSubmit}
    />
  );
}
