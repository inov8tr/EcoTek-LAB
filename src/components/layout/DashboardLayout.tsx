"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { MainNav } from "@/components/navigation/MainNav";
import { DashboardBreadcrumbs } from "@/components/navigation/DashboardBreadcrumbs";
import { Sidebar } from "@/components/layout/Sidebar";
import type { CurrentUser } from "@/lib/auth-helpers";

function getPageMeta(pathname: string) {
  switch (true) {
    case pathname.startsWith("/pma/batches"):
      return {
        title: "PMA Batches",
        description: "Batches and test results attached to a specific PMA formula.",
      };
    case pathname.startsWith("/capsules"):
      return {
        title: "Capsule Formulas",
        description:
          "Manage EcoCap capsule formulas, parameters, and material experiments.",
      };
    case pathname.startsWith("/pma"):
      return {
        title: "PMA Formulas",
        description:
          "Combine capsule formulas with bitumen inputs to define PMA candidates.",
      };
    case pathname.startsWith("/bitumen/origins"):
      return {
        title: "Bitumen Origins",
        description: "Capture refinery source, crude type, and supplier context.",
      };
    case pathname.startsWith("/binder-tests"):
      return {
        title: "Binder Test Data",
        description: "Upload lab PDFs, photos, videos, and structured results.",
      };
    case pathname.startsWith("/bitumen"):
      return {
        title: "Bitumen",
        description: "Bitumen origins and base binder validations.",
      };
    case pathname.startsWith("/analytics"):
      return {
        title: "Analytics",
        description:
          "Visualize storage stability, viscosity, recovery, and PG performance.",
      };
    case pathname.startsWith("/resources"):
      return {
        title: "Resources",
        description: "Process documentation, SOPs, and internal knowledge.",
      };
    case pathname.startsWith("/settings"):
      return {
        title: "Settings",
        description: "Configure roles, permissions, and lab preferences.",
      };
    case pathname.startsWith("/admin"):
      return {
        title: "Admin",
        description: "User management, access control, and system oversight.",
      };
    default:
      return {
        title: "Dashboard",
        description: "Overview of current projects, tests, and lab activity.",
      };
  }
}

export function DashboardLayout({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: CurrentUser;
}) {
  const pathname = usePathname() || "/dashboard";
  const { title, description } = getPageMeta(pathname);

  // Measure header height (dynamic)
  const [headerHeight, setHeaderHeight] = useState(64);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const cssVars: CSSProperties = {
    ["--header-height" as string]: `${headerHeight}px`,
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--color-bg-main)]"
      style={cssVars}
    >
      {/* GLOBAL HEADER — FIXED */}
      <header
        ref={headerRef}
        className="sticky top-0 z-[60] w-full bg-[var(--color-bg-main)]"
      >
        <MainNav currentUser={currentUser} />
      </header>

      {/* MAIN WRAPPER: sidebar + content */}
      <div className="flex flex-1 min-h-0 relative">
        {/* SIDEBAR (fixed or drawer mode handled inside component) */}
        <Sidebar
          userName={currentUser.name ?? currentUser.email ?? "User"}
          userRole={currentUser.role}
          userAvatarUrl={currentUser.avatarUrl}
        />

        {/* MAIN CONTENT — NO PADDING-LEFT LOGIC NEEDED */}
        <main
          className="
            flex-1 min-h-0 overflow-y-auto
            px-4 pt-[10px] pb-6 sm:px-6 lg:px-8
            relative z-0
          "
          style={{ paddingLeft: "calc(var(--sidebar-offset, 72px) + 8px)" }}
        >
          {/* PAGE HEADER (sticky INSIDE CONTENT AREA) */}
          <div
            className="
              relative z-[5]
              mb-6 rounded-2xl border border-border/60
              bg-card/95 px-4 py-4 shadow-md backdrop-blur-md
            "
          >
            <DashboardBreadcrumbs />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-sm text-[var(--color-text-subtle)]">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2" />
            </div>
          </div>

          {/* PAGE BODY */}
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
