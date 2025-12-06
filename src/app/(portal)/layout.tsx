import { ViewModeBanner } from "@/components/layout/view-mode-banner";
import { ViewModeProvider, ViewMode } from "@/context/view-mode-context";
import { requireStatus } from "@/lib/auth-helpers";
import { UserRole, UserStatus } from "@prisma/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireStatus(UserStatus.ACTIVE);
  const allowSwitching = currentUser.role === UserRole.ADMIN;

  return (
    <ViewModeProvider
      initialMode={(currentUser.role as ViewMode) ?? "VIEWER"}
      allowSwitching={allowSwitching}
    >
      <ViewModeBanner />
      <DashboardLayout currentUser={currentUser}>{children}</DashboardLayout>
    </ViewModeProvider>
  );
}
