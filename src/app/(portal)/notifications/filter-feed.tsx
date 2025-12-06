"use client";

import { useEffect, useMemo, useState } from "react";
import Ably from "ably";
import { formatDateTime } from "@/lib/utils";

type FeedItem = {
  id: string;
  eventType: string;
  detail?: string | null;
  category?: string | null;
  createdAt: Date;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "security", label: "Security" },
  { id: "account", label: "Account" },
  { id: "system", label: "System" },
] as const;

export function NotificationFilterFeed({ userId, initial }: { userId: string; initial: FeedItem[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY || process.env.ABLY_KEY;
    if (!key) return;
    const client = new Ably.Realtime({ key });
    const channel = client.channels.get(`user:${userId}`);
    channel.subscribe("notification", (msg) => {
      if (msg.data?.type === "new" && msg.data?.event?.id) {
        setItems((prev) => [
          {
            id: msg.data.event.id,
            eventType: msg.data.event.eventType,
            detail: msg.data.event.detail,
            category: msg.data.event.category ?? null,
            createdAt: new Date(msg.data.event.createdAt),
          },
          ...prev,
        ]);
      }
    });
    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [userId]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => (i.category ?? "system").toLowerCase() === filter);
  }, [filter, items]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === f.id ? "border-[var(--color-accent-primary)] text-[var(--color-text-heading)]" : "border-border text-[var(--color-text-muted)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.length === 0 && <li className="text-sm text-[var(--color-text-muted)]">No notifications.</li>}
        {filtered.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[var(--color-text-heading)]">{item.eventType}</div>
              {item.category && (
                <span className="rounded-full bg-[var(--color-bg-alt)] px-2 py-0.5 text-[10px] uppercase text-[var(--color-text-muted)]">
                  {item.category}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {formatDateTime(item.createdAt, undefined, undefined)} {item.detail ? `· ${item.detail}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
