"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";

type MaterialRow = {
  id: string;
  materialName: string;
  percentage: string;
};

type CapsuleFormulaEditorProps = {
  initialName?: string;
  initialDescription?: string;
  initialMaterials?: { materialName: string; percentage: number }[];
  onSubmit?: (payload: {
    name: string;
    description: string;
    materials: { materialName: string; percentage: number }[];
  }) => Promise<void> | void;
  submitLabel?: string;
};

const MAX_ROWS = 10;
const MIN_ROWS = 2;

export function CapsuleFormulaEditor({
  initialName = "",
  initialDescription = "",
  initialMaterials = [
    { materialName: "", percentage: 0 },
    { materialName: "", percentage: 0 },
  ],
  onSubmit,
  submitLabel = "Save Formula",
}: CapsuleFormulaEditorProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [materials, setMaterials] = useState<MaterialRow[]>(
    initialMaterials.slice(0, MAX_ROWS).map((row) => ({
      id: crypto.randomUUID(),
      materialName: row.materialName,
      percentage: row.percentage.toString(),
    }))
  );
  const [saving, setSaving] = useState(false);

  const roundedTotal = useMemo(() => {
    const total = materials.reduce((acc, row) => acc + (parseFloat(row.percentage) || 0), 0);
    return Math.round(total * 1000) / 1000;
  }, [materials]);

  const percentError = Math.abs(roundedTotal - 100) > 0.001;
  const disableAdd = materials.length >= MAX_ROWS;
  const disableRemove = materials.length <= MIN_ROWS;

  function handleMaterialChange(id: string, field: "materialName" | "percentage", value: string) {
    setMaterials((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  function handleAddRow() {
    if (disableAdd) return;
    setMaterials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), materialName: "", percentage: "0" },
    ]);
  }

  function handleRemoveRow(id: string) {
    if (disableRemove) return;
    setMaterials((prev) => prev.filter((row) => row.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (percentError || !onSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        materials: materials.map((row) => ({
          materialName: row.materialName.trim(),
          percentage: parseFloat(row.percentage) || 0,
        })),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard
        title="Capsule Metadata"
        description="Name and describe the capsule formula you are defining."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Formula Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EcoCap F-12A"
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description or target application"
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
            />
          </label>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Material Breakdown"
        description="Specify each material and ensure the total equals 100%."
        footer={
          <div className="flex items-center justify-between">
            <span
              className={
                percentError
                  ? "font-semibold text-red-600"
                  : "font-semibold text-[var(--color-text-heading)]"
              }
            >
              Total: {roundedTotal.toFixed(3)}%
            </span>
            <p className="text-[var(--color-text-muted)]">
              {materials.length}/{MAX_ROWS} rows
            </p>
          </div>
        }
      >
        <div className="space-y-3">
          {materials.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-border-subtle bg-white/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]"
            >
              <div className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
                <span className="text-[var(--color-text-muted)]">Material {index + 1}</span>
                <input
                  type="text"
                  value={row.materialName}
                  onChange={(e) =>
                    handleMaterialChange(row.id, "materialName", e.target.value)
                  }
                  placeholder="e.g. CRM, Aerosil 200"
                  className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </div>
              <div className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
                <span className="text-[var(--color-text-muted)]">Percentage (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.001}
                  value={row.percentage}
                  onChange={(e) =>
                    handleMaterialChange(row.id, "percentage", e.target.value)
                  }
                  className="w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-red-600"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={disableRemove}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddRow}
            disabled={disableAdd}
            className="rounded-full px-4 py-2 text-xs"
          >
            Add material
          </Button>
        </div>
      </DashboardCard>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={saving || percentError}
          className="rounded-full px-6 py-2"
        >
          {saving ? "Saving..." : submitLabel}
        </Button>
        {percentError && (
          <p className="text-sm font-semibold text-red-600">
            Total percentage must equal 100%.
          </p>
        )}
      </div>
    </form>
  );
}
