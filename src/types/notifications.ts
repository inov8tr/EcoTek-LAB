export type NotificationPreview = {
  id: string;
  eventType: string;
  detail?: string | null;
  category?: string | null;
  link?: string | null;
  createdAt: string;
  readAt?: string | null;
};
