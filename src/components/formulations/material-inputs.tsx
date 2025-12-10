"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_MATERIALS = 10;
const INITIAL_ROWS = 3;

export function MaterialInputs() {
  const [count, setCount] = useState(INITIAL_ROWS);

  const rows = Array.from({ length: count }, (_, index) => index + 1);
  const canAddMore = count < MAX_MATERIALS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-heading)]">Material Mix</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Specify up to {MAX_MATERIALS} materials with percentages totaling 100%.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full px-3 py-1 text-xs font-semibold"
          onClick={() => canAddMore && setCount((prev) => Math.min(prev + 1, MAX_MATERIALS))}
          disabled={!canAddMore}
        >
          Add material
        </Button>
      </div>

      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-white/70">
        {rows.map((row) => (
          <div
            key={row}
            className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_140px]"
          >
            <label className="text-xs font-semibold text-[var(--color-text-heading)]">
              <span className="block text-[var(--color-text-muted)]">Material {row}</span>
              <input
                type="text"
                name={`material-${row}`}
                placeholder="e.g. CRM, Aerosil 200"
                className="mt-1 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-[var(--color-text-heading)]">
              <span className="block text-[var(--color-text-muted)]">Percentage (%)</span>
              <input
                type="number"
                step="0.1"
                name={`material-${row}-pct`}
                placeholder="0.0"
                className="mt-1 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
              />
            </label>
          </div>
        ))}
      </div>

      {!canAddMore && (
        <p className="text-xs font-semibold text-[var(--color-text-muted)]">
          Maximum of {MAX_MATERIALS} materials reached.
        </p>
      )}
    </div>
  );
}
