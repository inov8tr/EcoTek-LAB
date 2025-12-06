"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { LogOut, Settings, User, HelpCircle, Globe, Moon, Sun, Laptop } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/auth-helpers";

export function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = user.displayName?.[0] ?? user.name?.[0] ?? user.email?.[0] ?? "U";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm transition hover:shadow-md"
      >
        <AvatarCircle src={user.avatarUrl ?? undefined} alt={user.displayName ?? user.name ?? "User"} fallback={initial} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5">
          <div className="px-4 py-3">
            <div className="text-sm font-semibold text-[var(--color-text-heading)] truncate">
              {user.displayName ?? user.name ?? "Account"}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</div>
          </div>
          <div className="border-t border-border">
            <MenuItem href={"/account" as Route} icon={<User className="h-4 w-4" />} label="Account" onSelect={() => setOpen(false)} />
            <MenuItem href={"/settings" as Route} icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => setOpen(false)} />
            <MenuItem href={"/resources/user-guide" as Route} icon={<HelpCircle className="h-4 w-4" />} label="Help / Support" onSelect={() => setOpen(false)} />
            <Divider />
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Theme</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <ToggleChip label="Light" icon={<Sun className="h-4 w-4" />} />
                <ToggleChip label="Dark" icon={<Moon className="h-4 w-4" />} />
                <ToggleChip label="System" icon={<Laptop className="h-4 w-4" />} />
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Language</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ToggleChip label="EN" icon={<Globe className="h-4 w-4" />} />
                <ToggleChip label="KO" icon={<Globe className="h-4 w-4" />} />
              </div>
            </div>
            <form action={logout} className="border-t border-border">
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]"
                onClick={() => setOpen(false)}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  label,
  icon,
  onSelect,
}: {
  href: Route;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]"
      onClick={onSelect}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}

function ToggleChip({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-1 rounded-lg border border-border bg-[var(--color-bg-alt)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]/70"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AvatarCircle({
  src,
  alt,
  fallback,
}: {
  src?: string;
  alt: string;
  fallback: string;
}) {
  if (src) {
    return (
      <div className="h-8 w-8 overflow-hidden rounded-full border border-border">
        <Image src={src} alt={alt} width={32} height={32} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-[var(--color-bg-alt)] text-sm font-semibold">
      {fallback.toUpperCase()}
    </div>
  );
}
