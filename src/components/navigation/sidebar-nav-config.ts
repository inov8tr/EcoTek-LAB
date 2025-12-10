import {
  Activity,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Settings,
  TestTube,
  User,
  Database,
  FolderKanban,
  Shield,
} from "lucide-react";

export type SidebarIcon = typeof LayoutDashboard;

export type SidebarChild = {
  id: string;
  label: string;
  href: string;
  icon: SidebarIcon;
};

export type SidebarSection = {
  id: string;
  label: string;
  icon: SidebarIcon;
  children: SidebarChild[];
};

export const sidebarSections: SidebarSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [{ id: "dashboard-home", label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    id: "formulations",
    label: "Formulations",
    icon: FlaskConical,
    children: [
      { id: "capsules", label: "Capsules", href: "/capsules", icon: FlaskConical },
      { id: "pma", label: "PMA", href: "/pma", icon: TestTube },
    ],
  },
  {
    id: "materials",
    label: "Materials",
    icon: TestTube,
    children: [{ id: "bitumen-origins", label: "Bitumen Origins", href: "/bitumen/origins", icon: FlaskConical }],
  },
  {
    id: "testing",
    label: "Testing & QA",
    icon: FileText,
    children: [
      { id: "binder-tests", label: "Binder Test Data", href: "/binder-tests", icon: FileText },
      { id: "storage-stability", label: "Storage Stability", href: "/analytics", icon: Activity },
      { id: "viscosity-dsr", label: "Viscosity / DSR", href: "/analytics", icon: Activity },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: FolderKanban,
    children: [
      { id: "api-gateway", label: "API Gateway", href: "/dashboard", icon: Activity },
      { id: "pipelines", label: "Pipelines / Sync", href: "/dashboard", icon: Activity },
      { id: "documents", label: "Documents", href: "/resources", icon: FileText },
      { id: "tables", label: "Tables", href: "/admin/database", icon: Database },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    children: [
      { id: "users", label: "Users & Roles", href: "/admin/users", icon: User },
      { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
      { id: "profile", label: "Profile", href: "/account", icon: User },
    ],
  },
];
