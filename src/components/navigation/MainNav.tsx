"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { RoleViewSwitcher } from "./RoleViewSwitcher";
import { useViewMode } from "@/context/view-mode-context";
import type { CurrentUser } from "@/lib/auth-helpers";
import { UserMenu } from "./UserMenu";

export function MainNav({ currentUser }: { currentUser: CurrentUser }) {
  const { allowSwitching } = useViewMode();

  return (
    <header className="sticky top-0 z-40 w-full border border-[#E3E8EF] bg-[#FFFFFF] shadow-md">
      <div className="flex w-full items-center gap-4 px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href={"/dashboard" as Route}
          className="flex items-center gap-3 rounded-2xl border border-[#E3E8EF] bg-[#FFFFFF] px-4 py-2 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg-alt)] shadow-inner">
            <Image src="/EcoTek Logo.svg" alt="EcoTek logo" width={32} height={32} priority />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#667085]">
              EcoTek
            </p>
            <p className="text-lg font-semibold text-[#1B1C1E]">R&amp;D Portal</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#667085]">
              {currentUser.role}
            </p>
            <p className="text-sm font-semibold text-[#1B1C1E]">
              {currentUser.displayName ?? currentUser.name ?? currentUser.email}
            </p>
          </div>

          <UserMenu user={currentUser} />
        </div>
      </div>
    </header>
  );
}
