"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";

import { RoleViewSwitcher } from "./RoleViewSwitcher";
import { useViewMode } from "@/context/view-mode-context";
import type { CurrentUser } from "@/lib/auth-helpers";
import { UserMenu } from "./UserMenu";
import type { NotificationPreview } from "@/types/notifications";
import { HEADER_HEIGHT } from "@/constants/layout";

type MainNavProps = {
  currentUser: CurrentUser;
  unreadCount?: number;
  pageTitle: string;
  pageDescription?: string;
  notifications?: NotificationPreview[];
};

export function MainNav({
  currentUser,
  unreadCount = 0,
  pageTitle,
  pageDescription,
  notifications = [],
}: MainNavProps) {
  const { allowSwitching } = useViewMode();

  return (
    <header
      className="
        sticky top-0 z-40
        bg-white border-b-2 border-brand-primary/50 shadow-sm
        flex items-center justify-between px-6 py-3
      "
      style={{ minHeight: HEADER_HEIGHT }}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center gap-6 min-w-0">
        {/* LOGO (Google-style compact) */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <Image
            src="/EcoTek Logo.svg"
            alt="EcoTek"
            width={48}
            height={48}
            priority
            className="h-11 w-auto"
          />
        </Link>

        {/* PAGE TITLES (Google Admin visual hierarchy) */}
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{pageTitle}</p>
          {pageDescription && (
            <p className="text-xs text-neutral-600 truncate">{pageDescription}</p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2">
        {/* Optional Role Switcher */}
        {allowSwitching && (
          <div className="hidden sm:flex">
            <RoleViewSwitcher />
          </div>
        )}

        <NotificationMenu notifications={notifications} unreadCount={unreadCount} />

        {/* User menu */}
        <UserMenu user={currentUser} unreadCount={unreadCount} />
      </div>
    </header>
  );
}

type NotificationMenuProps = {
  notifications: NotificationPreview[];
  unreadCount: number;
};

function NotificationMenu({ notifications, unreadCount }: NotificationMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative rounded-md p-2 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${open ? "bg-neutral-100" : ""}`}
      >
        <Bell className={`size-5 ${hasUnread ? "text-brand-primary" : "text-neutral-600"}`} />
        {hasUnread && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-primary px-[6px] text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium text-neutral-900">Notifications</p>
            {hasUnread && (
              <span className="text-xs font-semibold text-brand-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-600">You&apos;re all caught up.</p>
            ) : (
              notifications.map((notification) => (
                <NotificationPreviewRow key={notification.id} notification={notification} />
              ))
            )}
          </div>
          <Link
            href="/notifications"
            className="block border-t border-neutral-100 px-4 py-2 text-sm font-medium text-brand-primary hover:bg-neutral-50"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function NotificationPreviewRow({ notification }: { notification: NotificationPreview }) {
  const timeLabel = formatNotificationTime(notification.createdAt);
  const unread = !notification.readAt;
  return (
    <div
      className={`px-4 py-3 ${unread ? "bg-neutral-50" : "bg-white"}`}
    >
      <p className="text-sm font-semibold text-neutral-900">
        {formatEventLabel(notification.eventType)}
      </p>
      {notification.detail && (
        <p className="mt-1 text-sm text-neutral-600">{notification.detail}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
        <span>{timeLabel}</span>
        {notification.link && (
          <Link href={notification.link} className="text-brand-primary hover:underline">
            Open
          </Link>
        )}
      </div>
    </div>
  );
}

function formatNotificationTime(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  } catch {
    return timestamp;
  }
}

function formatEventLabel(raw: string) {
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
