"use client";

import { useEffect } from "react";
import Ably from "ably";
import { useRouter } from "next/navigation";

export function NotificationsStream({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY || process.env.ABLY_KEY;
    if (!key) return;
    const client = new Ably.Realtime({ key });
    const channel = client.channels.get(`user:${userId}`);
    channel.subscribe("notification", (msg) => {
      if (msg.data?.type === "read" || msg.data?.type === "read_all") {
        router.refresh();
      }
    });
    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [router, userId]);

  return null;
}
