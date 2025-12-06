"use client";

import { useViewMode, ViewMode } from "@/context/view-mode-context";

const OPTIONS: ViewMode[] = ["ADMIN", "RESEARCHER", "VIEWER"];

export function RoleViewSwitcher() {
  const { allowSwitching, viewMode, setViewMode } = useViewMode();
  if (!allowSwitching) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-[var(--color-card-light)] px-3 py-1 text-xs font-semibold text-[var(--color-text-heading)]">
      <span className="uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Viewing as</span>
      <select
        value={viewMode}
        onChange={(event) => setViewMode(event.target.value as ViewMode)}
        className="rounded-full border border-border bg-white px-2 py-1 text-xs font-semibold text-[var(--color-text-heading)] focus:outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
