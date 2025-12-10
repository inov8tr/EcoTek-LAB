"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";

type SelectOption = { id: string; label: string };

type PMAFormulaPayload = {
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
};

type PMAFormulaEditorProps = {
  capsuleOptions: SelectOption[];
  originOptions: SelectOption[];
  testOptionsByOrigin: Record<string, SelectOption[]>;
  initialData?: Partial<PMAFormulaPayload>;
  submitLabel?: string;
  onSubmit?: (payload: PMAFormulaPayload) => Promise<void> | void;
};

const ECOCAP_RANGE: [number, number] = [5, 20];
const REAGENT_RANGE: [number, number] = [0, 5];

export function PMAFormulaEditor({
  capsuleOptions,
  originOptions,
  testOptionsByOrigin,
  initialData,
  submitLabel = "Save PMA Formula",
  onSubmit,
}: PMAFormulaEditorProps) {
  const [form, setForm] = useState<PMAFormulaPayload>({
    name: initialData?.name ?? "",
    capsuleFormulaId: initialData?.capsuleFormulaId ?? capsuleOptions[0]?.id ?? "",
    bitumenOriginId: initialData?.bitumenOriginId ?? originOptions[0]?.id ?? "",
    bitumenTestId: initialData?.bitumenTestId ?? undefined,
    ecoCapPercentage: initialData?.ecoCapPercentage ?? 10,
    reagentPercentage: initialData?.reagentPercentage ?? 1,
    mixRpm: initialData?.mixRpm,
    mixTimeMinutes: initialData?.mixTimeMinutes,
    targetPgHigh: initialData?.targetPgHigh,
    targetPgLow: initialData?.targetPgLow,
    bitumenGradeOverride: initialData?.bitumenGradeOverride,
    notes: initialData?.notes,
  });
  const [saving, setSaving] = useState(false);

  const testsForOrigin = useMemo(() => {
    return testOptionsByOrigin[form.bitumenOriginId] ?? [];
  }, [form.bitumenOriginId, testOptionsByOrigin]);

  const ecoCapWarning =
    form.ecoCapPercentage < ECOCAP_RANGE[0] || form.ecoCapPercentage > ECOCAP_RANGE[1];
  const reagentWarning =
    form.reagentPercentage < REAGENT_RANGE[0] ||
    form.reagentPercentage > REAGENT_RANGE[1];

  const canSubmit =
    !!form.name &&
    !!form.capsuleFormulaId &&
    !!form.bitumenOriginId &&
    !ecoCapWarning &&
    !reagentWarning &&
    !!onSubmit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit?.(form);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof PMAFormulaPayload, value: string) {
    setForm((prev) => {
      if (["name", "capsuleFormulaId", "bitumenOriginId", "bitumenGradeOverride", "notes"].includes(field)) {
        return { ...prev, [field]: value };
      }
      if (field === "bitumenTestId") {
        return { ...prev, bitumenTestId: value === "" ? null : value };
      }
      return {
        ...prev,
        [field]: value === "" ? undefined : Number(value),
      };
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard
        title="Capsule & Bitumen Selection"
        description="Name the formula, link capsule, bitumen origin, and optional base test."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)] md:col-span-3">
            Formula Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. KR25-PG82-22"
              required
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
          <SelectField
            label="Capsule Formula"
            value={form.capsuleFormulaId}
            onChange={(val) => handleChange("capsuleFormulaId", val)}
            options={capsuleOptions}
          />
          <SelectField
            label="Bitumen Origin"
            value={form.bitumenOriginId}
            onChange={(val) => handleChange("bitumenOriginId", val)}
            options={originOptions}
          />
          <SelectField
            label="Base Bitumen Test (optional)"
            value={form.bitumenTestId ?? ""}
            onChange={(val) => handleChange("bitumenTestId", val)}
            options={testsForOrigin}
            allowEmpty
          />
        </div>
      </DashboardCard>

      <DashboardCard title="Mix Parameters">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label={`EcoCap % (${ECOCAP_RANGE[0]}–${ECOCAP_RANGE[1]})`}
            value={form.ecoCapPercentage}
            onChange={(val) => handleChange("ecoCapPercentage", val)}
            warning={ecoCapWarning}
            step={0.0001}
          />
          <NumberField
            label={`Reagent % (${REAGENT_RANGE[0]}–${REAGENT_RANGE[1]})`}
            value={form.reagentPercentage}
            onChange={(val) => handleChange("reagentPercentage", val)}
            warning={reagentWarning}
            step={0.0001}
          />
          <NumberField
            label="Mix RPM"
            value={form.mixRpm}
            onChange={(val) => handleChange("mixRpm", val)}
          />
          <NumberField
            label="Mix Time (min)"
            value={form.mixTimeMinutes}
            onChange={(val) => handleChange("mixTimeMinutes", val)}
            step={0.5}
          />
        </div>
      </DashboardCard>

      <DashboardCard title="Target PG & Notes">
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Target PG High"
            value={form.targetPgHigh}
            onChange={(val) => handleChange("targetPgHigh", val)}
          />
          <NumberField
            label="Target PG Low"
            value={form.targetPgLow}
            onChange={(val) => handleChange("targetPgLow", val)}
          />
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)] md:col-span-2">
            Override Bitumen Grade (optional)
            <input
              value={form.bitumenGradeOverride ?? ""}
              onChange={(e) => handleChange("bitumenGradeOverride", e.target.value)}
              placeholder="PG 82-28 (override)"
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)] md:col-span-2">
            Notes
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
      </DashboardCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!canSubmit || saving} className="rounded-full px-6 py-2">
          {saving ? "Saving..." : submitLabel}
        </Button>
        {(!canSubmit || ecoCapWarning || reagentWarning) && (
          <p className="text-sm text-red-600">
            Ensure EcoCap/Reagent % fall within the required ranges and capsule/origin are selected.
          </p>
        )}
      </div>
    </form>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  allowEmpty?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
      >
        {allowEmpty && (
          <option value="">
            No base test
          </option>
        )}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  warning,
}: {
  label: string;
  value?: number;
  onChange: (value: string) => void;
  step?: number;
  warning?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
      {label}
      <input
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-4 py-2 text-sm ${
          warning
            ? "border-red-500 bg-red-50 text-red-700"
            : "border-border-subtle bg-white text-[var(--color-text-heading)]"
        } focus:border-[var(--color-accent-primary)] focus:outline-none`}
      />
    </label>
  );
}
