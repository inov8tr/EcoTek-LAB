"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  binderTestId: string;
  metricId: string;
};

export function InvalidateMetricButton({ binderTestId, metricId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Reason for invalidation is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/binder-tests/${binderTestId}/metrics/${metricId}/invalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Unable to invalidate metric.");
        return;
      }
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  useEffect(() => {
    if (!open) return;
    reasonRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === "Tab") {
        const nodes = [reasonRef.current, closeRef.current, submitRef.current].filter(Boolean) as HTMLElement[];
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, pending]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-[var(--color-status-fail-text)]">
        Invalidate
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-lg border border-border-subtle bg-white p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invalidate-title"
            aria-describedby="invalidate-help"
          >
            <h3 id="invalidate-title" className="text-base font-semibold text-[var(--color-text-heading)]">
              Invalidate metric
            </h3>
            <p id="invalidate-help" className="mt-1 text-sm text-[var(--color-text-muted)]">
              Provide the reason. Metric will remain visible but excluded from analysis.
            </p>
            <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
              <textarea
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Reason for invalidation"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={pending}
                required
                ref={reasonRef}
                aria-describedby="invalidate-help"
              />
              {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  ref={closeRef}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[var(--color-status-fail)] text-white hover:bg-[var(--color-status-fail-text)]"
                  disabled={pending}
                  ref={submitRef}
                >
                  {pending ? "Invalidating..." : "Invalidate metric"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
