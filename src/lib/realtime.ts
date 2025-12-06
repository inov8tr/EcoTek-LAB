import Ably from "ably/promises";

let client: Ably.Realtime | null = null;

export function getAbly() {
  if (client) return client;
  const key = process.env.ABLY_KEY;
  if (!key) return null;
  client = new Ably.Realtime(key);
  return client;
}

export async function publishNotification(userId: string, payload: any) {
  const ably = getAbly();
  if (!ably) return;
  const channel = ably.channels.get(`user:${userId}`);
  await channel.publish("notification", payload);
}
