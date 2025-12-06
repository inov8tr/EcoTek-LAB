"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { LogOut, Settings, User, HelpCircle, Globe, Moon, Sun, Laptop, Bell } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/auth-helpers";
import { updateQuickPrefs } from "@/app/actions/prefs";

export function UserMenu({ user, unreadCount = 0 }: { user: CurrentUser; unreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeTheme = user.theme ?? "system";
  const activeLocale = user.locale ?? "en-US";
  const menuItemsRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (open && firstItemRef.current) {
      firstItemRef.current.focus();
    }
  }, [open]);

  const initial = user.displayName?.[0] ?? user.name?.[0] ?? user.email?.[0] ?? "U";

  function changePrefs(theme?: string, locale?: string) {
    startTransition(() => {
      const fd = new FormData();
      if (theme) fd.set("theme", theme);
      if (locale) fd.set("locale", locale);
      updateQuickPrefs(fd);
    });
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      changePrefs();
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
      >
        <AvatarCircle src={user.avatarUrl ?? undefined} alt={user.displayName ?? user.name ?? "User"} fallback={initial} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-accent-primary)] px-[6px] text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5"
          role="menu"
          aria-label="Account menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Tab") {
              const focusables = menuItemsRefs.current.filter(Boolean) as HTMLAnchorElement[];
              if (focusables.length === 0) return;
              const currentIndex = focusables.findIndex((el) => el === document.activeElement);
              if (e.shiftKey) {
                e.preventDefault();
                const prev = (currentIndex - 1 + focusables.length) % focusables.length;
                focusables[prev]?.focus();
              } else {
                e.preventDefault();
                const next = (currentIndex + 1) % focusables.length;
                focusables[next]?.focus();
              }
            }
          }}
        >
          <div className="px-4 py-3">
            <div className="text-sm font-semibold text-[var(--color-text-heading)] truncate">
              {user.displayName ?? user.name ?? "Account"}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</div>
          </div>
          <div className="border-t border-border">
            <MenuItem
              href={"/account" as Route}
              icon={<User className="h-4 w-4" />}
              label="Account"
              onSelect={() => setOpen(false)}
              firstRef={firstItemRef}
            />
            <MenuItem href={"/settings" as Route} icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => setOpen(false)} />
            <MenuItem
              href={"/notifications" as Route}
              icon={<Bell className="h-4 w-4" />}
              label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              onSelect={() => setOpen(false)}
              registerRef={(el) => (menuItemsRefs.current[2] = el)}
            />
            <MenuItem href={"/resources/user-guide" as Route} icon={<HelpCircle className="h-4 w-4" />} label="Help / Support" onSelect={() => setOpen(false)} />
            <Divider />
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Theme</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <ToggleChip
                  label="Light"
                  icon={<Sun className="h-4 w-4" />}
                  active={activeTheme === "light"}
                  onClick={() => changePrefs("light", undefined)}
                  onKeyDown={handleKeyDown}
                />
                <ToggleChip
                  label="Dark"
                  icon={<Moon className="h-4 w-4" />}
                  active={activeTheme === "dark"}
                  onClick={() => changePrefs("dark", undefined)}
                  onKeyDown={handleKeyDown}
                />
                <ToggleChip
                  label="System"
                  icon={<Laptop className="h-4 w-4" />}
                  active={activeTheme === "system"}
                  onClick={() => changePrefs("system", undefined)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Language</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ToggleChip
                  label="EN"
                  icon={<Globe className="h-4 w-4" />}
                  active={(activeLocale ?? "").startsWith("en")}
                  onClick={() => changePrefs(undefined, "en-US")}
                  onKeyDown={handleKeyDown}
                />
                <ToggleChip
                  label="KO"
                  icon={<Globe className="h-4 w-4" />}
                  active={(activeLocale ?? "").startsWith("ko")}
                  onClick={() => changePrefs(undefined, "ko-KR")}
                  onKeyDown={handleKeyDown}
                />
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
  firstRef,
  registerRef,
}: {
  href: Route;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  firstRef?: React.RefObject<HTMLAnchorElement>;
  registerRef?: (el: HTMLAnchorElement | null) => void;
}) {
  return (
    <Link
      ref={firstRef}
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]"
      role="menuitem"
      tabIndex={0}
      onClick={onSelect}
      ref={(el) => {
        if (firstRef) {
          // eslint-disable-next-line no-param-reassign
          (firstRef as any).current = el;
        }
        registerRef?.(el);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}

function ToggleChip({
  label,
  icon,
  active = false,
  onClick,
  onKeyDown,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
        active
          ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-text-heading)]"
          : "border-border bg-[var(--color-bg-alt)] text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]/70"
      }`}
      aria-pressed={active}
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
