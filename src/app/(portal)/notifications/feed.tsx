"use client";

import { useEffect, useState } from "react";
import Ably from "ably";
import { formatDateTime } from "@/lib/utils";

type FeedItem = {
  id: string;
  eventType: string;
  detail?: string | null;
  createdAt: Date;
};

export function NotificationFeed({ userId, initial }: { userId: string; initial: FeedItem[] }) {
  const [items, setItems] = useState(initial);

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

  return (
    <ul className="space-y-3">
      {items.length === 0 && <li className="text-sm text-[var(--color-text-muted)]">No notifications yet.</li>}
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
          <div className="font-semibold text-[var(--color-text-heading)]">{item.eventType}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {formatDateTime(item.createdAt, undefined, undefined)} {item.detail ? `· ${item.detail}` : ""}
          </div>
        </li>
      ))}
    </ul>
  );
}
