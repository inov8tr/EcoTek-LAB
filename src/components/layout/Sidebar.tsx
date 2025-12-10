"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftOpen, PanelLeftClose, Settings } from "lucide-react";

import { LogoutButton } from "@/components/navigation/LogoutButton";
import { sidebarSections } from "@/components/navigation/sidebar-nav-config";
import { SidebarSection } from "@/components/navigation/SidebarSection";

interface SidebarProps {
  userName: string;
  userRole: "ADMIN" | "RESEARCHER" | "VIEWER" | string;
  userCategory?: string | null;
  variant?: "dashboard" | "page";
  userAvatarUrl?: string | null;
}

const COLLAPSE_KEY = "ecotek.sidebar.collapsed";
const EXPANDED_WIDTH = 288; // 18rem
const COLLAPSED_WIDTH = 72; // 4.5rem

// Ensure your header defines this: :root { --header-height: 64px; }
const HEADER_VAR = "var(--header-height, 64px)";

export function Sidebar({ userName, userRole, userCategory, variant = "dashboard", userAvatarUrl }: SidebarProps) {
  const pathname = usePathname() || "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const findActiveSection = useMemo(
    () =>
      sidebarSections.find((section) =>
        section.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)),
      )?.id ?? sidebarSections[0]?.id,
    [pathname],
  );

  useEffect(() => {
    setOpenSection(findActiveSection);
  }, [findActiveSection]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Ensure open/close state follows active section
  useEffect(() => {
    if (collapsed) {
      setOpenSection(null);
    } else {
      setOpenSection(findActiveSection);
    }
  }, [collapsed, findActiveSection]);

  // Desktop detection + correct offset application
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const applyOffset = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      setIsDesktop(desktop);

      // Corrected logic: offset matches actual sidebar width
      const offset = desktop ? (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH) : 0;
      root.style.setProperty("--sidebar-offset", `${offset}px`);
    };

    applyOffset();
    window.addEventListener("resize", applyOffset);

    return () => {
      window.removeEventListener("resize", applyOffset);
      root.style.setProperty("--sidebar-offset", "0px");
    };
  }, [collapsed]);

  const handleSectionToggle = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const onNavigate = () => {
    setIsMobileMenuOpen(false);
    setCollapsed(true);
  };

  // Disable body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const effectiveCollapsed = collapsed && !hoverExpanded;

  const handleMouseEnter = () => {
    if (!isDesktop || !collapsed) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverExpanded(true), 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverExpanded(false);
  };

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <button
          type="button"
          aria-label="Toggle navigation"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E8EF] bg-white shadow-sm"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Google Admin–style overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[30] lg:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 z-[40] flex flex-col border-r border-[#E3E8EF] bg-[#F8F9FC] shadow-md transition-[width,transform] duration-200 overflow-hidden
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          width: effectiveCollapsed ? `${COLLAPSED_WIDTH}px` : `${EXPANDED_WIDTH}px`,
          top: HEADER_VAR,
          height: `calc(100vh - ${HEADER_VAR})`,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top utility area */}
        <div className="flex items-center gap-3 border-b border-[#E3E8EF] bg-white px-3 py-3">
          {!effectiveCollapsed && (
            <div className="flex min-w-0 flex-col p-[10px]">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#667085]">Workspace</span>
              <span className="truncate text-sm font-semibold text-[#1B1C1E]">EcoTek R&D Portal</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {sidebarSections.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              collapsed={effectiveCollapsed}
              isOpen={openSection === section.id}
              onToggle={handleSectionToggle}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {/* Bottom utility */}
        <div className="border-t border-[#E3E8EF] bg-white px-3 py-3">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} p-[10px]`}>
            {userAvatarUrl ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E3E8EF]">
                <Image src={userAvatarUrl} alt={userName} fill className="object-cover" sizes="40px" />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6EEF8] text-sm font-bold text-[#24548F]">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}

            {!effectiveCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1B1C1E]">{userName}</p>
                <span className="inline-block rounded-full border border-[#D0D5DD] px-2 py-0.5 text-[11px] font-semibold text-[#667085]">
                  {userCategory || userRole}
                </span>
              </div>
            )}
          </div>

          {/* Settings + Logout */}
          <div className={`mt-3 flex items-center ${effectiveCollapsed ? "justify-center gap-2" : "gap-2"}`}>
            <Link
              href={"/settings" as Route}
              className={`flex items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] text-sm font-semibold text-[#1B1C1E] transition hover:bg-[#F8F9FC] ${
                effectiveCollapsed ? "h-10 w-10" : "px-3 py-2"
              }`}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
              {!effectiveCollapsed && <span>Settings</span>}
            </Link>

            <LogoutButton iconOnly={effectiveCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
