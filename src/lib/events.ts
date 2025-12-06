import { prisma } from "@/lib/prisma";
import { publishNotification } from "@/lib/realtime";

type EventInput = {
  userId: string;
  eventType: string;
  detail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  category?: string | null;
  channel?: string | null;
  link?: string | null;
};

export async function recordEvent(input: EventInput) {
  const event = await prisma.securityEvent.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      detail: input.detail ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      category: input.category ?? null,
      channel: input.channel ?? null,
      link: input.link ?? null,
    },
  });

  const unread = await prisma.securityEvent.count({
    where: { userId: input.userId, readAt: null },
  });

  await publishNotification(input.userId, {
    type: "new",
    event: {
      id: event.id,
      eventType: event.eventType,
      detail: event.detail,
      createdAt: event.createdAt,
    },
    unread,
  });

  return event;
}
