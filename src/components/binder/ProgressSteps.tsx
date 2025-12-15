"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Step = { label: string; status: "done" | "active" | "pending" };

export function ProgressSteps({ steps }: { steps: Step[] }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <>
      <div className="fixed left-1/2 top-20 z-10 w-[calc(100%-3rem)] max-w-5xl -translate-x-1/2 rounded-xl border border-border-subtle bg-linear-to-r from-white via-slate-50 to-white shadow-md backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4 border-b border-border-subtle px-2 py-1">
          <button
            type="button"
            aria-label={expanded ? "Collapse progress" : "Expand progress"}
            className="flex items-center gap-2 text-xs font-semibold text-(--color-text-heading) hover:text-(--color-text-heading)"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="sr-only">Toggle progress</span>
          </button>
        </div>
        {expanded && (
          <div className="grid gap-3 px-4 py-3 md:grid-cols-4">
            {steps.map((step) => {
              const palette =
                step.status === "done"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : step.status === "active"
                    ? "bg-sky-50 text-sky-900 border-sky-200"
                    : "bg-slate-50 text-slate-500 border-slate-200";
              const icon = step.status === "done" ? "✓" : step.status === "active" ? "•" : "…";
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                      step.status === "done"
                        ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                        : step.status === "active"
                          ? "border-sky-400 bg-sky-100 text-sky-800"
                          : "border-slate-300 bg-slate-100 text-slate-500"
                    }`}
                  >
                    {icon}
                  </span>
                  <span className={step.status === "pending" ? "text-slate-500" : "text-slate-900"}>{step.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="h-16" aria-hidden="true" />
    </>
  );
}
