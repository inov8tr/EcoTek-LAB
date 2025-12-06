"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next"; // <-- ADD IMPORT
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildNavForRole, type Role } from "./nav-config";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const navSections = useMemo(() => buildNavForRole(role), [role]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-md border border-border-subtle bg-white/80 px-3 py-2 text-sm font-medium text-[var(--color-text-main)] shadow-sm md:hidden"
        type="button"
      >
        <Menu size={18} />
        <span>Menu</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-white p-6 shadow-xl transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="mb-6 inline-flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm"
          onClick={() => setOpen(false)}
          type="button"
        >
          <X size={18} />
          <span>Close</span>
        </button>

        <nav className="space-y-4 text-sm font-medium text-[var(--color-text-main)]">
          {navSections.map((section, idx) => (
            <div key={section.label ?? `mobile-section-${idx}`} className="space-y-2">
              {section.label && (
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {section.label}
                </p>
              )}
              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href as Route}   // <-- FIXED TYPING
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
