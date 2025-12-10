"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";

type BitumenOriginPayload = {
  refineryName: string;
  binderGrade: string;
  originCountry: string;
  description: string;
};

type BitumenOriginEditorProps = {
  initialData?: Partial<BitumenOriginPayload>;
  submitLabel?: string;
  onSubmit?: (payload: BitumenOriginPayload) => Promise<void> | void;
};

export function BitumenOriginEditor({
  initialData,
  submitLabel = "Save Bitumen Origin",
  onSubmit,
}: BitumenOriginEditorProps) {
  const [refineryName, setRefineryName] = useState(initialData?.refineryName ?? "");
  const [binderGrade, setBinderGrade] = useState(initialData?.binderGrade ?? "");
  const [originCountry, setOriginCountry] = useState(initialData?.originCountry ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        refineryName: refineryName.trim(),
        binderGrade: binderGrade.trim(),
        originCountry: originCountry.trim(),
        description: description.trim(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard
        title="Bitumen Origin"
        description="Document the refinery source and base binder characteristics."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Refinery / Supplier
            <input
              required
              value={refineryName}
              onChange={(e) => setRefineryName(e.target.value)}
              placeholder="GS Caltex Ulsan, SK Energy, etc."
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Binder Grade
            <input
              required
              value={binderGrade}
              onChange={(e) => setBinderGrade(e.target.value)}
              placeholder="PG 64-22, VG 40, etc."
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
            Origin Country
            <input
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              placeholder="South Korea, USA, etc."
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)] md:col-span-2">
            Notes
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include any observations about crude source, processing details, or special handling."
              rows={4}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
            />
          </label>
        </div>
      </DashboardCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="rounded-full px-6 py-2">
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
