"use client";

import { useEffect, useState, useTransition } from "react";

export function SnoozeToggle() {
  const [snoozedUntil, setSnoozedUntil] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("notif_snooze_until");
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) setSnoozedUntil(parsed);
    }
  }, []);

  function snooze(minutes: number) {
    startTransition(() => {
      const until = new Date(Date.now() + minutes * 60 * 1000);
      setSnoozedUntil(until);
      localStorage.setItem("notif_snooze_until", until.toISOString());
    });
  }

  function clear() {
    startTransition(() => {
      setSnoozedUntil(null);
      localStorage.removeItem("notif_snooze_until");
    });
  }

  const active = snoozedUntil && snoozedUntil > new Date();

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      {active ? (
        <>
          <span>Snoozed until {snoozedUntil?.toLocaleTimeString()}</span>
          <button
            type="button"
            onClick={clear}
            className="rounded bg-[var(--color-bg-alt)] px-2 py-1 font-semibold text-[var(--color-text-heading)]"
            disabled={isPending}
          >
            Clear
          </button>
        </>
      ) : (
        <>
          <span>Do Not Disturb:</span>
          <button
            type="button"
            onClick={() => snooze(30)}
            className="rounded bg-[var(--color-bg-alt)] px-2 py-1 font-semibold text-[var(--color-text-heading)]"
            disabled={isPending}
          >
            30m
          </button>
          <button
            type="button"
            onClick={() => snooze(120)}
            className="rounded bg-[var(--color-bg-alt)] px-2 py-1 font-semibold text-[var(--color-text-heading)]"
            disabled={isPending}
          >
            2h
          </button>
        </>
      )}
    </div>
  );
}
