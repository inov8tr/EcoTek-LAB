"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteRequestModalProps {
  targetTable: string;
  targetId: number | string;
  triggerLabel?: string;
}

export function DeleteRequestModal({
  targetTable,
  targetId,
  triggerLabel = "Request deletion",
}: DeleteRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const lastRef = useRef<HTMLButtonElement | null>(null);

  async function submitRequest() {
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch("/api/deletion-requests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetTable, targetId, reason }),
    });
    setPending(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to submit request.");
      return;
    }
    setReason("");
    setOpen(false);
    router.refresh();
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === "Tab") {
        const focusables = [firstRef.current, lastRef.current].filter(Boolean) as HTMLElement[];
        if (focusables.length < 2) return;
        const active = document.activeElement;
        if (e.shiftKey && active === firstRef.current) {
          e.preventDefault();
          lastRef.current?.focus();
        } else if (!e.shiftKey && active === lastRef.current) {
          e.preventDefault();
          firstRef.current?.focus();
        }
      }
    }
    if (open) {
      firstRef.current?.focus();
      document.addEventListener("keydown", handleKey);
    }
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[var(--color-text-link)] underline-offset-4 hover:underline"
      >
        {triggerLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" aria-modal="true" role="dialog">
          <div
            ref={dialogRef}
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Submit deletion request</h3>
            <p className="text-sm text-[var(--color-text-main)]">
              Explain why this record or file should be removed. An administrator will review your request.
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
              placeholder="Provide context for deletion..."
            />
            {error && <p className="text-sm font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                ref={firstRef}
                onClick={() => {
                  setOpen(false);
                  setReason("");
                  setError(null);
                }}
                className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]"
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                ref={lastRef}
                onClick={submitRequest}
                className="rounded-full bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={pending}
              >
                {pending ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
