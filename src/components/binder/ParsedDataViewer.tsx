"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Metric = {
  id: string;
  metricType: string;
  metricName?: string | null;
  position?: string | null;
  value?: string | number | null;
  units?: string | null;
  temperature?: string | number | null;
  frequency?: string | number | null;
  sourceFile?: { id?: string; filename?: string | null } | null;
  sourcePage?: number | null;
  isUserConfirmed?: boolean;
  language?: string | null;
  parseRunId?: string | null;
  confidence?: string | number | null;
};

export function ParsedDataViewer({ metrics }: { metrics: Metric[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  function formatValue(value: unknown) {
    if (value === null || value === undefined) return "—";
    return typeof value === "number" ? Number(value).toLocaleString() : String(value);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={metrics.length === 0 || pending}
        onClick={() => {
          setPending(false);
          setOpen(true);
        }}
      >
        View Parsed Data
      </Button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Parsed metrics</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Data returned from the latest parse run.</p>
              </div>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            {metrics.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No metrics available.</p>
            ) : (
              <div className="space-y-2">
                {metrics.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border-subtle bg-white/80 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {m.metricName ?? m.metricType} {m.position ? `· ${m.position}` : ""}
                  </p>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {m.language ?? ""} {m.isUserConfirmed ? "· Confirmed" : ""}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatValue(m.value)} {m.units ?? ""} {m.temperature ? `@ ${formatValue(m.temperature)}` : ""}{" "}
                  {m.frequency ? `· ${formatValue(m.frequency)}` : ""}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Source: {m.sourceFile?.filename ?? m.sourceFile?.id ?? "n/a"} {m.sourcePage ? `p.${m.sourcePage}` : ""}
                  {m.confidence !== undefined && m.confidence !== null ? ` · Confidence: ${formatValue(m.confidence)}` : ""}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Parse run: {m.parseRunId ?? "unknown"}
                </p>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      )}
    </>
  );
}
