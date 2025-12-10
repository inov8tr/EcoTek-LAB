"use client";

import Link from "next/link";
import { type Route } from "next";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/capsules": "Capsule Formulas",
  "/pma": "PMA Formulas",
  "/pma/batches": "Batches",
  "/bitumen": "Bitumen",
  "/bitumen/origins": "Origins",
  "/binder-tests": "Binder Test Data",
  "/binder-tests/new": "New Binder Test",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/resources": "Resources",
  "/admin": "Admin",
  "/admin/database": "Database",
  "/admin/users": "Users",
};

function getBreadcrumbParts(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const parts: { href: string; label: string }[] = [];
  let current = "";

  segments.forEach((seg) => {
    current += `/${seg}`;
    parts.push({
      href: current,
      label: LABELS[current] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    });
  });

  return parts;
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const parts = getBreadcrumbParts(pathname || "/dashboard");

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-xs text-neutral-500"
    >
      <Link
        href={"/dashboard" as Route}
        className="inline-flex items-center gap-1 hover:text-neutral-700"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {parts.map((part, idx) => (
        <div key={part.href} className="flex items-center gap-2">
          <ChevronRight size={14} />

          {idx === parts.length - 1 ? (
            <span className="font-medium text-neutral-700">{part.label}</span>
          ) : (
            <Link
              href={part.href as Route}
              className="hover:text-neutral-700"
            >
              {part.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
