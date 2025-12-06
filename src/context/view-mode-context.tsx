"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type ViewMode = "ADMIN" | "RESEARCHER" | "VIEWER";

type ViewModeContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  allowSwitching: boolean;
  resetViewMode: () => void;
};

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined);

const STORAGE_KEY = "ecotek-view-mode";

export function ViewModeProvider({
  children,
  initialMode,
  allowSwitching,
}: {
  children: React.ReactNode;
  initialMode: ViewMode;
  allowSwitching: boolean;
}) {
  const [storedMode, setStoredMode] = useState<ViewMode>(() => {
    if (!allowSwitching) return initialMode;
    const cached =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as ViewMode | null)
        : null;
    if (cached && MODES.includes(cached)) {
      return cached;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, initialMode);
    }
    return initialMode;
  });

  const effectiveMode = allowSwitching ? storedMode : initialMode;

  const contextValue = useMemo<ViewModeContextValue>(
    () => ({
      viewMode: effectiveMode,
      allowSwitching,
      setViewMode: (mode: ViewMode) => {
        if (!allowSwitching) return;
        setStoredMode(mode);
        window.localStorage.setItem(STORAGE_KEY, mode);
      },
      resetViewMode: () => {
        if (!allowSwitching) return;
        setStoredMode(initialMode);
        window.localStorage.setItem(STORAGE_KEY, initialMode);
      },
    }),
    [effectiveMode, allowSwitching, initialMode],
  );

  return <ViewModeContext.Provider value={contextValue}>{children}</ViewModeContext.Provider>;
}

const MODES: ViewMode[] = ["ADMIN", "RESEARCHER", "VIEWER"];

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
