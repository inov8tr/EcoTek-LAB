"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import type { CurrentUser } from "@/lib/auth-helpers";
import type { Route } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildNavForRole, type Role } from "./nav-config";

export function SidebarNav({ currentUser }: { currentUser: CurrentUser }) {
  const pathname = usePathname();
  const role = currentUser.role as Role;
  const [collapsed, setCollapsed] = useState(true);

  const navSections = useMemo(() => buildNavForRole(role), [role]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-[92px] z-30 hidden h-[calc(100vh-92px)] border-r border-border-subtle bg-white/80 backdrop-blur-xl md:flex",
        "flex-col transition-all duration-300 shadow-[0_10px_40px_rgba(15,23,42,0.08)]",
        collapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => collapsed && setCollapsed(false)}
      onMouseLeave={() => !collapsed && setCollapsed(true)}
    >
      <div className="flex items-center justify-between px-3 py-4">
        {!collapsed && (
          <span className="text-sm font-semibold uppercase tracking-wide text-(--color-text-heading)">
            Navigation
          </span>
        )}

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-subtle bg-white/70 text-gray-600 hover:bg-gray-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {navSections.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`} className="space-y-1">
            {!collapsed && section.label && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                {section.label}
              </p>
            )}

            {section.items.map((i) => {
              const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
              const Icon = i.icon;

              return (
                <Link
                  key={i.href}
                  href={i.href as Route}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-(--color-accent-sustainability)/20 text-(--color-text-heading) shadow-sm"
                      : "text-(--color-text-main) hover:bg-gray-100"
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span>{i.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border-subtle px-3 py-4">
        {collapsed ? (
          <div className="flex justify-center">
            <LogoutButton iconOnly />
          </div>
        ) : (
          <LogoutButton />
        )}
      </div>
    </aside>
  );
}
