"use client";

import { useMemo } from "react";
import { useViewMode } from "@/context/view-mode-context";
import { cn } from "@/lib/utils";

const modeStyles: Record<string, string> = {
  ADMIN: "bg-[var(--color-accent-primary)]/10 text-[var(--color-text-heading)]",
  RESEARCHER: "bg-[var(--color-accent-durability)]/15 text-[var(--color-text-heading)]",
  VIEWER: "bg-[var(--color-accent-reliability,#cfe8ff)] text-[var(--color-text-heading)]",
};

export function ViewModeBanner() {
  const { allowSwitching, viewMode, resetViewMode } = useViewMode();
  const isClient = typeof window !== "undefined";
  const bannerStyle = useMemo(
    () => modeStyles[viewMode] ?? modeStyles.RESEARCHER,
    [viewMode],
  );

  if (!isClient || !allowSwitching || viewMode === "ADMIN") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border px-4 py-3 text-sm md:flex-row md:items-center md:justify-between",
        bannerStyle,
      )}
    >
      <p className="font-semibold">
        You are currently viewing the system as: <span className="uppercase">{viewMode}</span>
      </p>
      <button
        type="button"
        onClick={resetViewMode}
        className="text-xs font-semibold text-[var(--color-text-link)] underline-offset-4 hover:underline"
      >
        Return to Admin view
      </button>
    </div>
  );
}
