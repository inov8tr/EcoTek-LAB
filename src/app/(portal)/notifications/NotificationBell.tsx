"use client";

import Link from "next/link";
import type { Route } from "next";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Ably from "ably";
import { useEffect, useState } from "react";

export function NotificationBell({ userId, initialCount = 0 }: { userId: string; initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const router = useRouter();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY || process.env.ABLY_KEY;
    if (!key) return;
    const client = new Ably.Realtime({ key });
    const channel = client.channels.get(`user:${userId}`);
    channel.subscribe("notification", (msg) => {
      if (typeof msg.data?.unread === "number") {
        setCount(msg.data.unread);
      } else {
        // fallback: refresh to pull latest count
        router.refresh();
      }
    });
    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [router, userId]);

  return (
    <Link href={"/notifications" as Route} className="relative inline-flex items-center justify-center rounded-full border border-border bg-white p-2 hover:bg-[var(--color-bg-alt)]" aria-label="Notifications">
      <Bell className="h-5 w-5 text-[var(--color-text-heading)]" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-accent-primary)] px-[6px] text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
