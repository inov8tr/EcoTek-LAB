"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";

type BatchPayload = {
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
};

type PmaBatchFormProps = {
  pmaFormulaId: string;
  onSubmit?: (payload: BatchPayload) => Promise<void> | void;
  submitLabel?: string;
  initialData?: Partial<BatchPayload>;
};

export function PmaBatchForm({
  pmaFormulaId,
  onSubmit,
  submitLabel = "Save Batch",
  initialData,
}: PmaBatchFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BatchPayload>({
    pmaFormulaId,
    batchCode: initialData?.batchCode ?? "",
    sampleDate: initialData?.sampleDate,
    notes: initialData?.notes,
    softeningPoint: initialData?.softeningPoint,
    viscosity135: initialData?.viscosity135,
    viscosity165: initialData?.viscosity165,
    ductility: initialData?.ductility,
    elasticRecovery: initialData?.elasticRecovery,
    storageStabilityDifference: initialData?.storageStabilityDifference,
    pgHigh: initialData?.pgHigh,
    pgLow: initialData?.pgLow,
  });

  const storageWarning =
    form.storageStabilityDifference !== undefined &&
    (form.storageStabilityDifference < 0 || form.storageStabilityDifference > 100);
  const softeningWarning =
    form.softeningPoint !== undefined &&
    (form.softeningPoint < 40 || form.softeningPoint > 120);

  const canSubmit = form.batchCode.trim().length > 0 && !storageWarning && !softeningWarning;

  function handleChange(field: keyof BatchPayload, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]:
        ["batchCode", "sampleDate", "notes"].includes(field) || value === ""
          ? (value as string)
          : Number(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit || !canSubmit) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard title="Batch Details">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Batch Code
            <input
              required
              value={form.batchCode}
              onChange={(e) => handleChange("batchCode", e.target.value)}
              placeholder="e.g. PMA-2025-01"
              className="w-full rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Sample Date
            <input
              type="date"
              value={form.sampleDate ?? ""}
              onChange={(e) => handleChange("sampleDate", e.target.value)}
              className="w-full rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
        </div>
        <label className="mt-3 block space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
          Notes
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm"
          />
        </label>
      </DashboardCard>

      <DashboardCard
        title="Binder Test Measurements"
        description="Enter the key MSCR/physical metrics for this batch."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Softening Point (°C)"
            value={form.softeningPoint}
            onChange={(v) => handleChange("softeningPoint", v)}
            warning={softeningWarning}
          />
          <NumberField
            label="Viscosity @ 135°C (mPa·s)"
            value={form.viscosity135}
            onChange={(v) => handleChange("viscosity135", v)}
          />
          <NumberField
            label="Viscosity @ 165°C (mPa·s)"
            value={form.viscosity165}
            onChange={(v) => handleChange("viscosity165", v)}
          />
          <NumberField
            label="Ductility (cm)"
            value={form.ductility}
            onChange={(v) => handleChange("ductility", v)}
          />
          <NumberField
            label="Elastic Recovery (%)"
            value={form.elasticRecovery}
            onChange={(v) => handleChange("elasticRecovery", v)}
          />
          <NumberField
            label="Storage Stability Δ (%)"
            value={form.storageStabilityDifference}
            onChange={(v) => handleChange("storageStabilityDifference", v)}
            warning={storageWarning}
          />
          <NumberField
            label="PG High"
            value={form.pgHigh}
            onChange={(v) => handleChange("pgHigh", v)}
          />
          <NumberField
            label="PG Low"
            value={form.pgLow}
            onChange={(v) => handleChange("pgLow", v)}
          />
        </div>
      </DashboardCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!canSubmit || saving} className="rounded-full px-6 py-2">
          {saving ? "Saving..." : submitLabel}
        </Button>
        {storageWarning && (
          <p className="text-sm text-red-600">
            Storage stability must be between 0 and 100%.
          </p>
        )}
        {softeningWarning && (
          <p className="text-sm text-red-600">
            Softening point should be between 40–120°C.
          </p>
        )}
      </div>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
  warning,
}: {
  label: string;
  value?: number;
  onChange: (v: string) => void;
  warning?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
      {label}
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border px-4 py-2 text-sm ${
          warning
            ? "border-red-500 bg-red-50 text-red-700"
            : "border-border-subtle bg-white text-[var(--color-text-heading)]"
        }`}
      />
    </label>
  );
}
