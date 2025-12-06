"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/navigation/MainNav";
import { DashboardBreadcrumbs } from "@/components/navigation/DashboardBreadcrumbs";
import { Sidebar } from "@/components/layout/Sidebar";
import type { CurrentUser } from "@/lib/auth-helpers";
import { useEffect } from "react";

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
  unreadCount = 0,
}: {
  children: React.ReactNode;
  currentUser: CurrentUser;
  unreadCount?: number;
}) {
  const pathname = usePathname() || "/dashboard";
  const { title, description } = getPageMeta(pathname);

  useEffect(() => {
    if (currentUser.theme) {
      document.documentElement.dataset.theme = currentUser.theme;
    }
    if (currentUser.locale) {
      document.documentElement.lang = currentUser.locale;
    }
  }, [currentUser.theme, currentUser.locale]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg-main)]">
      <div
        className="transition-[padding] pr-4 sm:pr-6 lg:pr-8"
        style={{ paddingLeft: "var(--sidebar-offset)" }}
      >
        <MainNav currentUser={currentUser} unreadCount={unreadCount} />
      </div>

      <div className="flex flex-1 min-h-0">
        <Sidebar userName={currentUser.name ?? currentUser.email ?? "User"} userRole={currentUser.role} />

        <main
          className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 transition-[padding]"
          style={{ paddingLeft: "var(--sidebar-offset)" }}
        >
          <header className="sticky top-0 z-10 mb-6 rounded-2xl border border-border-subtle bg-white/90 px-4 py-4 backdrop-blur">
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
          </header>

          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
