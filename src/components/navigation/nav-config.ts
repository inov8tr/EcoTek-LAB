import type { ComponentType } from "react";
import {
  LayoutDashboard,
  FlaskConical,
  TestTube,
  Droplets,
  Microscope,
  BarChart3,
  BookOpen,
  Settings,
  Users,
  Bell,
} from "lucide-react";

export type Role = "ADMIN" | "RESEARCHER" | "VIEWER";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  roles?: Role[];
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Formulations",
    items: [
      { href: "/capsules", label: "Capsule Formulas", icon: FlaskConical },
      { href: "/pma", label: "PMA Formulas", icon: TestTube },
    ],
  },
  {
    label: "Bitumen",
    items: [
      { href: "/bitumen/origins", label: "Origins", icon: Droplets },
    ],
  },
  {
    label: "Testing",
    items: [
      {
        href: "/binder-tests",
        label: "Binder Test Data",
        icon: Microscope,
        roles: ["ADMIN", "RESEARCHER"],
      },
    ],
  },
  {
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/resources", label: "Resources", icon: BookOpen },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
      { href: "/admin/database", label: "Database", icon: BookOpen, roles: ["ADMIN"] },
      { href: "/admin/users", label: "Admin", icon: Users, roles: ["ADMIN"] },
    ],
  },
];

export function buildNavForRole(role: Role): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
