"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";

import { buildNavForRole, type Role } from "@/components/navigation/nav-config";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { cn } from "@/lib/utils";
import { HEADER_HEIGHT } from "@/constants/layout";

interface SidebarProps {
  userName: string;
  userRole: Role | string;
  userCategory?: string | null;
}

const ROLE_FALLBACK: Role = "VIEWER";

function normalizeRole(role: string | Role): Role {
  if (role === "ADMIN" || role === "RESEARCHER" || role === "VIEWER") {
    return role;
  }
  return ROLE_FALLBACK;
}

export function Sidebar({ userName, userRole, userCategory }: SidebarProps) {
  const pathname = usePathname() ?? "/dashboard";

  // Mobile drawer
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse hover behavior
  const [isCollapsed, setIsCollapsed] = useState(true);

  const normalizedRole = normalizeRole(userRole);
  const navSections = useMemo(() => buildNavForRole(normalizedRole), [normalizedRole]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const initials = userName?.charAt(0)?.toUpperCase() ?? "U";

  useEffect(() => {
    setExpandedSections((prev) => {
      const next: Record<string, boolean> = {};
      navSections.forEach((section, idx) => {
        const key = section.label ?? `section-${idx}`;
        next[key] = prev[key] ?? true; // sections always expanded inside expanded mode
      });
      return next;
    });
  }, [navSections]);

  const sidebarWidth = isCollapsed ? "lg:w-20" : "lg:w-64";

  return (
    <>
      {/* MOBILE TOGGLE BUTTON */}
      <button
        type="button"
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        className="
          fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center 
          rounded-md border border-neutral-200 bg-white text-neutral-700 shadow-sm 
          hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 
          lg:hidden
        "
        onClick={() => setIsMobileOpen((prev) => !prev)}
      >
        {isMobileOpen ? <X className="size-5 text-neutral-600" /> : <Menu className="size-5 text-neutral-600" />}
      </button>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        aria-label="Primary navigation"
        className={cn(
          `
          fixed left-0 z-30 
          flex flex-col 
          border-r border-neutral-200 bg-white shadow-sm 
          transition-all duration-200 ease-in-out
        `,
          sidebarWidth,
          // mobile drawer
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          top: HEADER_HEIGHT,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        {/* ONLY SHOW THIS WHEN EXPANDED */}
        {!isCollapsed && (
          <div className="border-b border-neutral-200 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Navigation</p>
            <p className="text-sm font-medium text-neutral-900">Manage console areas</p>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section, idx) => {
            const key = section.label ?? `section-${idx}`;
            const expanded = expandedSections[key] ?? true;

            return (
              <div key={key} className="px-2">
                {/* SECTION LABEL (hidden when collapsed) */}
                {!isCollapsed && (
                  <button
                    type="button"
                    className="
                      flex w-full items-center justify-between 
                      px-2 pt-4 pb-2 
                      text-[10px] font-medium uppercase tracking-wider 
                      text-neutral-500 hover:text-neutral-700
                    "
                    onClick={() =>
                      setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  >
                    <span>{section.label}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-neutral-500 transition-transform",
                        expanded ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                )}

                {/* NAV ITEMS */}
                <div className={cn("space-y-1", !isCollapsed && !expanded && "hidden")}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <div key={item.href} className="group relative" data-active={isActive || undefined}>
                        <Link
                          href={item.href as Route}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            `
                            relative flex items-center gap-3 
                            px-4 py-2.5 rounded-md cursor-pointer 
                            text-neutral-700 hover:bg-neutral-100 
                            transition-colors
                          `,
                            isCollapsed && "justify-center",
                            isActive && "bg-neutral-100 text-brand-primary font-medium"
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-0 h-full w-[3px] bg-brand-primary rounded-r-md" />
                          )}

                          <Icon className="size-5 text-neutral-600 group-hover:text-neutral-700 group-data-[active=true]:text-brand-primary" />

                          {!isCollapsed && (
                            <span className="text-sm font-medium text-neutral-900">{item.label}</span>
                          )}
                        </Link>

                        {/* TOOLTIP */}
                        {isCollapsed && (
                          <span
                            className="
                            pointer-events-none absolute 
                            left-full ml-2 top-1/2 -translate-y-1/2 
                            hidden whitespace-nowrap 
                            rounded-md bg-neutral-900 px-2 py-1 
                            text-xs text-white 
                            group-hover:block
                          "
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div
              className="
              flex h-10 w-10 items-center justify-center 
              rounded-full bg-neutral-100 
              text-sm font-medium text-neutral-700
            "
            >
              {initials}
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{userName}</p>
                {(userCategory || userRole) && (
                  <p className="text-xs uppercase text-neutral-600">{userCategory ?? userRole}</p>
                )}
              </div>
            )}
          </div>

          <div className={cn("mt-4", isCollapsed && "flex justify-center")}>
            <LogoutButton iconOnly={isCollapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
