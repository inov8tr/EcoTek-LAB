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
        "fixed left-0 top-[92px] z-30 hidden h-[calc(100vh-92px)] md:flex",
        "flex-col transition-all duration-300",
        "border border-border/40 bg-card/95 shadow-2xl backdrop-blur-md",
        collapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => collapsed && setCollapsed(false)}
      onMouseLeave={() => !collapsed && setCollapsed(true)}
    >
      <div className="flex items-center justify-between px-3 py-4">
        {!collapsed && (
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-heading)]">
            Navigation
          </span>
        )}

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/90 text-foreground hover:bg-accent/40"
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
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
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
                    "group flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-border/60 bg-accent/60 text-foreground shadow-md"
                      : "border-transparent text-[var(--color-text-heading)] hover:border-border/50 hover:bg-accent/50 hover:shadow-sm"
                  )}
                >
                  <Icon size={20} className="shrink-0 text-primary transition-transform group-hover:scale-110" />
                  {!collapsed && <span>{i.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
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
