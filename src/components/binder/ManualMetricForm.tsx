"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type FileOption = { id?: string; fileName?: string | null };

type Props = {
  binderTestId: string;
  files: FileOption[];
  disabled?: boolean;
};

export function ManualMetricForm({ binderTestId, files, disabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    metricType: "",
    metricName: "",
    position: "",
    value: "",
    units: "",
    temperature: "",
    frequency: "",
    sourceFileId: "",
    sourcePage: "",
  });

  const canSubmit = !disabled && !pending;

  function toNumber(value: string, parser: (v: string) => number): number | null {
    if (value === "" || value === null || value === undefined) return null;
    const num = parser(value);
    return Number.isFinite(num) ? num : null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        metricType: form.metricType.trim(),
        metricName: form.metricName.trim() || null,
        position: form.position.trim() || null,
        value: toNumber(form.value, parseFloat),
        units: form.units.trim() || null,
        temperature: toNumber(form.temperature, parseFloat),
        frequency: toNumber(form.frequency, parseFloat),
        sourceFileId: form.sourceFileId || null,
        sourcePage: toNumber(form.sourcePage, (v) => parseInt(v, 10)),
      };

      const res = await fetch(`/api/binder-tests/${binderTestId}/metrics/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Unable to add manual metric");
        return;
      }

      setForm({
        metricType: "",
        metricName: "",
        position: "",
        value: "",
        units: "",
        temperature: "",
        frequency: "",
        sourceFileId: "",
        sourcePage: "",
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-white/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-heading)]">Manual metric entry</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Use when parsing fails or returns partial/incorrect data. Entries are recorded as confirmed.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} disabled={pending || disabled}>
          {open ? "Hide form" : "Add metric"}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Metric type (e.g., PG Softening Point)"
              value={form.metricType}
              onChange={(e) => setForm((f) => ({ ...f, metricType: e.target.value }))}
              disabled={!canSubmit}
            />
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Metric name (optional)"
              value={form.metricName}
              onChange={(e) => setForm((f) => ({ ...f, metricName: e.target.value }))}
              disabled={!canSubmit}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Position"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              disabled={!canSubmit}
            />
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Value"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              disabled={!canSubmit}
              type="number"
              step="any"
            />
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Units"
              value={form.units}
              onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
              disabled={!canSubmit}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Temperature"
              value={form.temperature}
              onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))}
              disabled={!canSubmit}
              type="number"
              step="any"
            />
            <input
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Frequency"
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              disabled={!canSubmit}
              type="number"
              step="any"
            />
            <div className="flex gap-2">
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={form.sourceFileId}
                onChange={(e) => setForm((f) => ({ ...f, sourceFileId: e.target.value }))}
                disabled={!canSubmit}
              >
                <option value="">Source file (optional)</option>
                {files.map((file) => (
                  <option key={file.id ?? file.fileName} value={file.id}>
                    {file.fileName ?? file.id}
                  </option>
                ))}
              </select>
              <input
                className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Page"
                value={form.sourcePage}
                onChange={(e) => setForm((f) => ({ ...f, sourcePage: e.target.value }))}
                disabled={!canSubmit}
                type="number"
              />
            </div>
          </div>
          {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
          <div className="flex justify-end">
            <Button
              size="sm"
              type="submit"
              className="bg-primary text-white hover:bg-primaryHover"
              disabled={!canSubmit || form.metricType.trim().length === 0}
            >
              {pending ? "Saving..." : "Save manual metric"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
