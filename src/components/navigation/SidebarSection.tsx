"use client";

import React, { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { SidebarSection as SidebarSectionConfig } from "./sidebar-nav-config";
import { SidebarItem } from "./SidebarItem";

type SidebarSectionProps = {
  section: SidebarSectionConfig;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
  pathname: string;
  onNavigate?: () => void;
};

function isActivePath(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarSection({
  section,
  collapsed,
  isOpen,
  onToggle,
  pathname,
  onNavigate,
}: SidebarSectionProps) {
  const hasActiveChild = useMemo(
    () => section.children.some((child) => isActivePath(child.href, pathname)),
    [section.children, pathname],
  );
  const sectionOpen = !collapsed && isOpen;

  const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(section.id);
    }
    if (e.key === "ArrowRight" && !isOpen) {
      e.preventDefault();
      onToggle(section.id);
    }
    if (e.key === "ArrowLeft" && isOpen) {
      e.preventDefault();
      onToggle(section.id);
    }
  };

  return (
    <div className="relative space-y-1 group">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        onKeyDown={handleKey}
        aria-expanded={sectionOpen}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24548F] ${
          hasActiveChild ? "bg-[#E6EEF8] text-[#24548F] font-semibold" : "text-[#1B1C1E] hover:bg-[#F2F4F7]"
        } ${collapsed ? "justify-center" : ""}`}
        >
        <section.icon className="h-5 w-5 shrink-0 text-current" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{section.label}</span>
            <ChevronDown
              className={`h-4 w-4 text-[#667085] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {collapsed && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 rounded-md border border-[#E3E8EF] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-heading)] shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <div className="flex items-center gap-2">
            <section.icon className="h-4 w-4 text-current" />
            <span>{section.label}</span>
          </div>
        </div>
      )}

      {sectionOpen && (
        <div
          className="overflow-hidden transition-[max-height] duration-200 max-h-96"
          aria-hidden={!sectionOpen}
        >
          <div className="mt-1 space-y-1 pl-2">
            {section.children.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                collapsed={false}
                active={isActivePath(child.href, pathname)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
