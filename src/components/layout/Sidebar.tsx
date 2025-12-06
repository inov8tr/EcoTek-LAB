"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Settings,
  BarChart3,
  Menu,
  X,
  User,
  Home,
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  TestTube,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/navigation/LogoutButton";

type SidebarItem = {
  id: string;
  name: string;
  href: string;
  icon: typeof Home;
  description?: string;
};

type SidebarModeConfig = {
  headerButtons: SidebarItem[];
  navigation: SidebarItem[];
};

interface SidebarProps {
  userName: string;
  userRole: "ADMIN" | "RESEARCHER" | "VIEWER" | string;
  userCategory?: string | null;
  variant?: "dashboard" | "page";
}

/* ---------------- GLOBAL NAVIGATION ---------------- */
const globalNav: SidebarItem[] = [
  { id: "global-dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview of activity" },
  { id: "global-capsules", name: "Capsule Formulas", href: "/capsules", icon: FlaskConical, description: "Manage EcoCap capsule formulas" },
  { id: "global-pma", name: "PMA Formulas", href: "/pma", icon: TestTube, description: "Combine capsules and bitumen" },
  { id: "global-bitumen-origins", name: "Bitumen Origins", href: "/bitumen/origins", icon: Droplets, description: "Refinery sources and suppliers" },
  { id: "global-binder-tests", name: "Binder Test Data", href: "/binder-tests", icon: FileText, description: "PDFs, photos, videos, results" },
  { id: "global-analytics", name: "Analytics", href: "/analytics", icon: BarChart3, description: "Reports and insights" },
  { id: "global-resources", name: "Resources", href: "/resources", icon: FileText, description: "Docs and SOPs" },
  { id: "global-settings", name: "Settings", href: "/settings", icon: Settings, description: "Configure preferences" },
];

/* ---------------- ADMIN NAVIGATION ---------------- */
const adminNav: SidebarItem[] = [
  { id: "admin-home", name: "Admin Home", href: "/admin", icon: LayoutDashboard },
  { id: "admin-users", name: "Users", href: "/admin/users", icon: User },
  { id: "admin-standards", name: "Standards", href: "/admin/standards", icon: Settings },
  { id: "admin-settings", name: "System Settings", href: "/admin/settings", icon: Settings },
  { id: "admin-binder-tests", name: "Binder Test Data", href: "/binder-tests", icon: FileText },
  { id: "admin-database", name: "Database", href: "/admin/database", icon: Settings },
];

const sidebarModes: Record<"dashboardRoot" | "adminOverview" | "adminPage" | "default", SidebarModeConfig> = {
  dashboardRoot: {
    headerButtons: [{ id: "header-dashboard", name: "Dashboard", href: "/dashboard", icon: Home }],
    navigation: globalNav,
  },
  adminOverview: {
    headerButtons: [{ id: "header-dashboard", name: "Dashboard", href: "/dashboard", icon: Home }],
    navigation: adminNav,
  },
  adminPage: {
    headerButtons: [
      { id: "header-dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
      { id: "header-back-to-admin", name: "Back To Admin", href: "/admin", icon: ArrowLeft },
    ],
    navigation: adminNav,
  },
  default: {
    headerButtons: [{ id: "header-dashboard", name: "Dashboard", href: "/dashboard", icon: Home }],
    navigation: globalNav,
  },
};

export function Sidebar({ userName, userRole, userCategory, variant = "dashboard" }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  let modeKey: keyof typeof sidebarModes = "default";
  if (pathname === "/dashboard") modeKey = "dashboardRoot";
  else if (pathname === "/admin") modeKey = "adminOverview";
  else if (pathname?.startsWith("/admin")) modeKey = "adminPage";

  const { headerButtons, navigation } = sidebarModes[modeKey];
  const hasHeaderDashboard = headerButtons.some((btn) => btn.href === "/dashboard");
  const baseNav = hasHeaderDashboard ? navigation.filter((item) => item.href !== "/dashboard") : navigation;

  const sidebarNavigation =
    userRole === "VIEWER"
      ? baseNav.filter((item) => item.id !== "global-binder-tests" && item.id !== "admin-binder-tests")
      : baseNav;

  useEffect(() => {
    const root = document.documentElement;
    const applyOffset = () => {
      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
      const value = isDesktop ? (isDesktopCollapsed ? "3rem" : "20rem") : "0rem";
      root.style.setProperty("--sidebar-offset", value);
    };

    applyOffset();
    window.addEventListener("resize", applyOffset);
    return () => {
      window.removeEventListener("resize", applyOffset);
      root.style.setProperty("--sidebar-offset", "0rem");
    };
  }, [isDesktopCollapsed]);

  const sidebarClasses =
    variant === "dashboard"
      ? "top-0 h-screen lg:top-4 lg:h-[calc(100vh-2rem)]"
      : "top-0 h-screen lg:top-4 lg:h-[calc(100vh-2rem)]";

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button
          variant="outline"
          className="h-10 w-10 p-0 bg-card/90 shadow-lg backdrop-blur-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* COLLAPSE BUTTON */}
      <div
        className="fixed top-4 z-50 hidden lg:block transition-all duration-300"
        style={{ left: isDesktopCollapsed ? "1rem" : "18rem" }}
      >
        <Button
          variant="outline"
          className="h-10 w-10 p-0 bg-card/95 shadow-lg backdrop-blur-md"
          onClick={() => setIsDesktopCollapsed((prev) => !prev)}
        >
          {isDesktopCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 lg:left-4 z-40 flex w-72 flex-col border border-border/40 bg-card/95 shadow-2xl backdrop-blur-md transition-transform duration-300 lg:rounded-3xl ${
          sidebarClasses
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} ${
          isDesktopCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"
        }`}
      >
        {/* LOGO */}
        <div className="border-b border-border/40 p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/EcoTek Logo.svg"
              alt="EcoTek Logo"
              width={64}
              height={28}
              className="h-auto w-auto max-w-[64px]"
              priority
            />
            <p className="text-lg font-semibold opacity-80">Revitalizing the Future</p>
          </div>
        </div>

        {/* HEADER BUTTONS */}
        {headerButtons.length > 0 && (
          <div className="border-b border-border/40 p-4">
            <div className="space-y-2">
              {headerButtons.map((button) => {
                const Icon = button.icon;
                return (
                  <Link key={button.id} href={button.href as Route} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2 shadow-sm">
                      <Icon className="h-4 w-4" />
                      {button.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* NAV MENU */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {sidebarNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <li key={item.id}>
                  <Link
                    href={item.href as Route}
                    className={`group flex items-start gap-3 rounded-lg border p-4 transition-all duration-200 ${
                      isActive
                        ? "border-border/60 bg-accent/60 shadow-md"
                        : "border-transparent hover:border-border/50 hover:bg-accent/50 hover:shadow-md"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform group-hover:scale-110" />
                    <div>
                      <div className="font-semibold text-foreground">{item.name}</div>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* USER + LOGOUT */}
        <div className="border-t border-border/40 p-4">
          <div className="rounded-lg bg-accent/30 p-4 shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {userName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    userCategory?.toLowerCase() === "admin" || userRole === "ADMIN"
                      ? "bg-blue-500/90 text-white"
                      : "bg-amber-500/90 text-white"
                  }`}
                >
                  {userCategory || userRole}
                </span>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
