"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { MainNav } from "@/components/navigation/MainNav";
import { Sidebar } from "@/components/layout/Sidebar";
import type { CurrentUser } from "@/lib/auth-helpers";
import type { NotificationPreview } from "@/types/notifications";

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
        description: "Manage EcoCap capsule formulas, parameters, and material experiments.",
      };
    case pathname.startsWith("/pma"):
      return {
        title: "PMA Formulas",
        description: "Combine capsule formulas with bitumen inputs to define PMA candidates.",
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
        description: "Visualize storage stability, viscosity, recovery, and PG performance.",
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
  notifications = [],
}: {
  children: React.ReactNode;
  currentUser: CurrentUser;
  unreadCount?: number;
  notifications?: NotificationPreview[];
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
    <div className="flex min-h-screen flex-col bg-[#E5EAF6] text-neutral-900">

      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* TOP NAV */}
      <MainNav
        currentUser={currentUser}
        unreadCount={unreadCount}
        pageTitle={title}
        pageDescription={description}
        notifications={notifications}
      />

      {/* MAIN APP LAYOUT */}
      <div className="flex flex-1 overflow-hidden">

        {/* FIXED SIDEBAR */}
        <Sidebar
          userName={currentUser.name ?? currentUser.email ?? "User"}
          userRole={currentUser.role}
          userCategory={currentUser.role}
        />

        {/* MAIN CONTENT AREA */}
        <main
          id="main-content"
          className="
            relative flex-1 overflow-y-auto border-l border-neutral-200 bg-white
            py-6 pr-6
            pl-24
            lg:pl-24
            lg:pr-8
            shadow-sm
          "
        >
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
