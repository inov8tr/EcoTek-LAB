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

  // Explicit role → mode mapping (future-proof)
  const roleToMode: Record<UserRole, ViewMode> = {
    ADMIN: "ADMIN",
    RESEARCHER: "RESEARCHER",
    VIEWER: "VIEWER",
  };

  const initialMode: ViewMode = roleToMode[currentUser.role] ?? "VIEWER";

  return (
    <ViewModeProvider initialMode={initialMode} allowSwitching={allowSwitching}>
      <DashboardLayout currentUser={currentUser}>
        <ViewModeBanner />
        {children}
      </DashboardLayout>
    </ViewModeProvider>
  );
}
