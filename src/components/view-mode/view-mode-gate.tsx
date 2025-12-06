"use client";

import { PropsWithChildren } from "react";
import { useViewMode, ViewMode } from "@/context/view-mode-context";

const ORDER: Record<ViewMode, number> = {
  VIEWER: 0,
  RESEARCHER: 1,
  ADMIN: 2,
};

export function ViewModeGate({
  minRole,
  fallback,
  children,
}: PropsWithChildren<{
  minRole: ViewMode;
  fallback?: React.ReactNode;
}>) {
  const { viewMode } = useViewMode();
  const allowed = ORDER[viewMode] >= ORDER[minRole];
  if (allowed) {
    return <>{children}</>;
  }
  return (
    fallback ?? (
      <p className="text-sm font-semibold text-[var(--color-text-muted)]">
        This action is unavailable in Viewer Mode.
      </p>
    )
  );
}
