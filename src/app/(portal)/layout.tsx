import { ViewModeBanner } from "@/components/layout/view-mode-banner";
import { ViewModeProvider, ViewMode } from "@/context/view-mode-context";
import { requireStatus, type CurrentUser } from "@/lib/auth-helpers";
import { UserRole, UserStatus } from "@prisma/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NotificationsStream } from "./notifications/stream";
import type { NotificationPreview } from "@/types/notifications";
import { dbQuery } from "@/lib/db-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireStatus(UserStatus.ACTIVE);
  const [freshUser] = await dbQuery<{
    name: string | null;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    handle: string | null;
    bio: string | null;
    locale: string | null;
    timeZone: string | null;
    theme: string | null;
  }>(
    [
      'SELECT "name", "displayName", "email", "avatarUrl", "bannerUrl",',
      '"handle", "bio", "locale", "timeZone", "theme"',
      'FROM "User" WHERE "id" = $1 LIMIT 1',
    ].join(" "),
    [currentUser.id],
  );
  const hydratedUser: CurrentUser = {
    ...currentUser,
    ...freshUser,
  };
  const [unreadRow] = await dbQuery<{ count: string }>(
    'SELECT COUNT(*)::text as count FROM "SecurityEvent" WHERE "userId" = $1 AND "readAt" IS NULL',
    [hydratedUser.id],
  );
  const unreadCount = Number(unreadRow?.count ?? 0);
  const notificationRecords = await dbQuery<{
    id: string;
    eventType: string;
    detail: string | null;
    category: string | null;
    link: string | null;
    createdAt: string;
    readAt: string | null;
  }>(
    [
      'SELECT "id", "eventType", "detail", "category", "link", "createdAt", "readAt"',
      'FROM "SecurityEvent" WHERE "userId" = $1',
      'ORDER BY "createdAt" DESC',
      "LIMIT 6",
    ].join(" "),
    [hydratedUser.id],
  );
  const notifications: NotificationPreview[] = notificationRecords.map((item) => ({
    id: item.id,
    eventType: item.eventType,
    detail: item.detail,
    category: item.category,
    link: item.link,
    createdAt: new Date(item.createdAt).toISOString(),
    readAt: item.readAt ? new Date(item.readAt).toISOString() : null,
  }));
  const allowSwitching = hydratedUser.role === UserRole.ADMIN;

  return (
    <ViewModeProvider
      initialMode={(hydratedUser.role as ViewMode) ?? "VIEWER"}
      allowSwitching={allowSwitching}
    >
      <ViewModeBanner />
      <DashboardLayout currentUser={hydratedUser} unreadCount={unreadCount} notifications={notifications}>
        {children}
        <NotificationsStream userId={hydratedUser.id} />
      </DashboardLayout>
    </ViewModeProvider>
  );
}
