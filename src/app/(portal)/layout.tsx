import { ViewModeBanner } from "@/components/layout/view-mode-banner";
import { ViewModeProvider, ViewMode } from "@/context/view-mode-context";
import { requireStatus, type CurrentUser } from "@/lib/auth-helpers";
import { UserRole, UserStatus } from "@prisma/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { prisma } from "@/lib/prisma";
import { NotificationsStream } from "./notifications/stream";
import type { NotificationPreview } from "@/types/notifications";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireStatus(UserStatus.ACTIVE);
  const freshUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      name: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bannerUrl: true,
      handle: true,
      bio: true,
      locale: true,
      timeZone: true,
      theme: true,
    },
  });
  const hydratedUser: CurrentUser = {
    ...currentUser,
    ...freshUser,
  };
  const unreadCount = await prisma.securityEvent.count({
    where: { userId: hydratedUser.id, readAt: null },
  });
  const notificationRecords = await prisma.securityEvent.findMany({
    where: { userId: hydratedUser.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      eventType: true,
      detail: true,
      category: true,
      link: true,
      createdAt: true,
      readAt: true,
    },
  });
  const notifications: NotificationPreview[] = notificationRecords.map((item) => ({
    id: item.id,
    eventType: item.eventType,
    detail: item.detail,
    category: item.category,
    link: item.link,
    createdAt: item.createdAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
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
