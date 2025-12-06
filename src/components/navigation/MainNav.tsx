"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { RoleViewSwitcher } from "./RoleViewSwitcher";
import { useViewMode } from "@/context/view-mode-context";
import type { CurrentUser } from "@/lib/auth-helpers";
import { UserMenu } from "./UserMenu";

export function MainNav({ currentUser, unreadCount = 0 }: { currentUser: CurrentUser; unreadCount?: number }) {
  const { allowSwitching } = useViewMode();

  return (
    <header className="sticky top-0 z-40 mx-4 rounded-2xl border border-border-subtle bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-8 py-8">
        <Link
          href={"/dashboard" as Route}
          className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--color-card-light)] px-4 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg-alt)] shadow-inner">
            <Image src="/EcoTek Logo.svg" alt="EcoTek logo" width={32} height={32} priority />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
              EcoTek
            </p>
            <p className="text-lg font-semibold text-[var(--color-text-heading)]">R&amp;D Portal</p>
          </div>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          {allowSwitching && (
            <div className="hidden lg:block">
              <RoleViewSwitcher />
            </div>
          )}

          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
              {currentUser.role}
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-heading)]">
              {currentUser.displayName ?? currentUser.name ?? currentUser.email}
            </p>
          </div>

          <UserMenu user={currentUser} unreadCount={unreadCount} />
       </div>
     </div>
   </header>
 );
}
