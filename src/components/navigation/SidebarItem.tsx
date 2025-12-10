"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Route } from "next";
import type { SidebarChild } from "./sidebar-nav-config";

type SidebarItemProps = {
  item: SidebarChild;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({ item, collapsed, active, onNavigate }: SidebarItemProps) {
  const tooltipId = useMemo(() => `tooltip-${item.id}`, [item.id]);
  return (
    <div className="relative group">
      <Link
        href={item.href as Route}
        onClick={onNavigate}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24548F] ${
          active
            ? "bg-[#E6EEF8] text-[#24548F] font-semibold"
            : "text-[#1B1C1E] hover:bg-[#F2F4F7] hover:font-semibold"
        } ${collapsed ? "justify-center" : ""}`}
        aria-current={active ? "page" : undefined}
        tabIndex={0}
      >
        <span
          aria-hidden
          className={`absolute left-0 top-0 h-full w-[3px] rounded-full transition-colors duration-150 ${
            active ? "bg-[#24548F]" : "bg-transparent"
          }`}
        />
        <item.icon className="h-5 w-5 shrink-0 text-current" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {collapsed && (
        <div
          role="tooltip"
          id={tooltipId}
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-md border border-[#E3E8EF] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-heading)] shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4 text-current" />
            <span>{item.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
