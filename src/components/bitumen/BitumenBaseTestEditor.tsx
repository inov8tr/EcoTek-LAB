"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";

type BitumenBaseTestPayload = {
  bitumenOriginId: string;
  batchCode: string;
  softeningPoint?: number;
  penetration?: number;
  viscosity135?: number;
  viscosity165?: number;
  basePgHigh?: number;
  basePgLow?: number;
  baseDuctility?: number;
  baseRecovery?: number;
  notes?: string;
  testedAt?: string;
};

type BitumenBaseTestEditorProps = {
  originOptions: { id: string; label: string }[];
  initialData?: Partial<BitumenBaseTestPayload>;
  submitLabel?: string;
  onSubmit?: (payload: BitumenBaseTestPayload) => Promise<void> | void;
};

export function BitumenBaseTestEditor({
  originOptions,
  initialData,
  submitLabel = "Save Base Test",
  onSubmit,
}: BitumenBaseTestEditorProps) {
  const [form, setForm] = useState<BitumenBaseTestPayload>({
    bitumenOriginId: initialData?.bitumenOriginId ?? originOptions[0]?.id ?? "",
    batchCode: initialData?.batchCode ?? "",
    softeningPoint: initialData?.softeningPoint,
    penetration: initialData?.penetration,
    viscosity135: initialData?.viscosity135,
    viscosity165: initialData?.viscosity165,
    basePgHigh: initialData?.basePgHigh,
    basePgLow: initialData?.basePgLow,
    baseDuctility: initialData?.baseDuctility,
    baseRecovery: initialData?.baseRecovery,
    notes: initialData?.notes,
    testedAt: initialData?.testedAt,
  });
  const [saving, setSaving] = useState(false);

  const pgSuggestion = useMemo(() => {
    if (typeof form.softeningPoint !== "number") return null;
    if (form.softeningPoint >= 76) return { high: 76, low: -22 };
    if (form.softeningPoint >= 70) return { high: 70, low: -16 };
    if (form.softeningPoint >= 64) return { high: 64, low: -16 };
    return null;
  }, [form.softeningPoint]);

  function handleChange(field: keyof BitumenBaseTestPayload, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "testedAt"
          ? value
          : value === ""
          ? undefined
          : ["bitumenOriginId", "batchCode", "notes"].includes(field)
          ? value
          : Number(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard
        title="Base Binder Test"
        description="Record baseline performance metrics for the selected bitumen origin."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Bitumen Origin
            <select
              required
              value={form.bitumenOriginId}
              onChange={(e) => handleChange("bitumenOriginId", e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            >
              {originOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Lab Batch Code
            <input
              required
              value={form.batchCode}
              onChange={(e) => handleChange("batchCode", e.target.value)}
              placeholder="e.g. BO-2025-01"
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Tested At
            <input
              type="datetime-local"
              value={form.testedAt ?? ""}
              onChange={(e) => handleChange("testedAt", e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
        </div>
      </DashboardCard>

      <DashboardCard title="Physical Properties">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricField
            label="Softening Point (°C)"
            value={form.softeningPoint}
            onChange={(value) => handleChange("softeningPoint", value)}
          />
          <MetricField
            label="Penetration (0.1 mm)"
            value={form.penetration}
            onChange={(value) => handleChange("penetration", value)}
          />
          <MetricField
            label="Viscosity @ 135°C (mPa·s)"
            value={form.viscosity135}
            onChange={(value) => handleChange("viscosity135", value)}
          />
          <MetricField
            label="Viscosity @ 165°C (mPa·s)"
            value={form.viscosity165}
            onChange={(value) => handleChange("viscosity165", value)}
          />
          <MetricField
            label="Ductility (cm)"
            value={form.baseDuctility}
            onChange={(value) => handleChange("baseDuctility", value)}
          />
          <MetricField
            label="Elastic Recovery (%)"
            value={form.baseRecovery}
            onChange={(value) => handleChange("baseRecovery", value)}
          />
        </div>
      </DashboardCard>

      <DashboardCard
        title="PG Grade"
        description="Enter the base PG RA result or accept the automated suggestion."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            PG High
            <input
              type="number"
              value={form.basePgHigh ?? ""}
              onChange={(e) => handleChange("basePgHigh", e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            PG Low
            <input
              type="number"
              value={form.basePgLow ?? ""}
              onChange={(e) => handleChange("basePgLow", e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
        </div>

        {pgSuggestion && (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Suggestion based on softening point: PG {pgSuggestion.high}-{pgSuggestion.low}
          </p>
        )}
      </DashboardCard>

      <DashboardCard title="Notes / Observations">
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </DashboardCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="rounded-full px-6 py-2">
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function MetricField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
      {label}
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
      />
    </label>
  );
}
