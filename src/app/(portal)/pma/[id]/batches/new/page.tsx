"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { PmaBatchForm } from "@/components/pma/PmaBatchForm";

type PageProps = { params: Promise<{ id: string }> };

export default function NewPmaBatchPage({ params }: PageProps) {
  const router = useRouter();
  const paramsPromise = params;

  async function handleSubmit(payload: {
    pmaFormulaId: string;
    batchCode: string;
    sampleDate?: string;
    notes?: string;
    softeningPoint?: number;
    viscosity135?: number;
    viscosity165?: number;
    ductility?: number;
    elasticRecovery?: number;
    storageStabilityDifference?: number;
    pgHigh?: number;
    pgLow?: number;
  }) {
    const { id } = await paramsPromise;
    const res = await fetch("/api/pma/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to create PMA batch");
    }
    router.push(`/pma/${id}/batches` as Route);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Add PMA Batch</h1>
        <p className="text-[var(--color-text-muted)]">
          Capture batch details and binder test metrics for this PMA.
        </p>
      </div>
      <PmaBatchForm
        pmaFormulaId={undefined as unknown as string}
        onSubmit={async (form) => {
          const { id } = await paramsPromise;
          await handleSubmit({ ...form, pmaFormulaId: id });
        }}
      />
    </div>
  );
}
