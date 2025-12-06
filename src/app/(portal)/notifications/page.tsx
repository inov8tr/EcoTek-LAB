import { UserStatus } from "@prisma/client";
import { requireStatus } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { publishNotification } from "@/lib/realtime";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export default async function NotificationsPage() {
  const user = await requireStatus(UserStatus.ACTIVE);

  const events = await prisma.securityEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  // broadcast latest unread count for connected clients
  if (events.length) {
    await publishNotification(user.id, {
      type: "count",
      unread: events.filter((e) => !e.readAt).length,
    });
  }

  const securityEvents = events.filter((e) => e.eventType.toLowerCase().includes("login") || e.eventType.toLowerCase().includes("2fa"));
  const accountEvents = events.filter((e) => !securityEvents.includes(e));
  const unreadCount = events.filter((e) => !e.readAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-heading)]">Notifications</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Recent security alerts, account activity, and system notices.
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-accent-primary)] px-2 py-0.5 text-xs font-semibold text-white">
              Unread: {unreadCount}
            </span>
          )}
        </p>
      </div>

      {unreadCount > 0 && (
        <form action={markAllNotificationsRead}>
          <button className="rounded-lg bg-[var(--color-bg-alt)] px-3 py-2 text-xs font-semibold text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]/80">
            Mark all as read
          </button>
        </form>
      )}

      <StatusStrip
        items={[
          {
            label: "Login alerts",
            status: user.loginAlerts ? "On" : "Off",
            detail: "Emails for new logins",
            href: "/settings",
          },
          {
            label: "Two-factor auth",
            status: user.twoFactorEnabled ? "Enabled" : "Disabled",
            detail: user.twoFactorEnabled ? "TOTP required at sign-in" : "Add 2FA for extra security",
            href: "/settings#twofactor",
          },
          {
            label: "Email notifications",
            status: user.notificationEmailOptIn ? "On" : "Off",
            detail: "Account and security emails",
            href: "/settings",
          },
        ]}
      />

      <NotificationCard
        title="Security activity"
        description="Logins, 2FA, and other sensitive events."
        empty="No security alerts yet."
        items={securityEvents}
        locale={user.locale ?? "en-US"}
        timeZone={user.timeZone ?? "UTC"}
        showActions
      />

      <NotificationCard
        title="Account updates"
        description="Profile, email, and preference changes."
        empty="No account changes recorded."
        items={accountEvents}
        locale={user.locale ?? "en-US"}
        timeZone={user.timeZone ?? "UTC"}
        showActions
      />

      <SystemCard />
    </div>
  );
}

function NotificationCard({
  title,
  description,
  items,
  empty,
  locale,
  timeZone,
  showActions = false,
}: {
  title: string;
  description: string;
  empty: string;
  items: Awaited<ReturnType<typeof prisma.securityEvent.findMany>>;
  locale: string;
  timeZone: string;
  showActions?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white">
      <div className="border-b border-border bg-[var(--color-bg-alt)] px-4 py-3">
        <div className="text-sm font-semibold text-[var(--color-text-heading)]">{title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-[var(--color-text-muted)]">{empty}</p>
      ) : (
        <ul className="divide-y">
          {items.map((e) => (
            <li key={e.id} className="flex items-start justify-between px-4 py-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-[var(--color-text-heading)]">{e.eventType}</div>
                  {!e.readAt && (
                    <span className="rounded-full bg-[var(--color-accent-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
                      New
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatDateTime(e.createdAt, locale, timeZone)} {e.detail ? `· ${e.detail}` : ""}
                </div>
                {e.userAgent && (
                  <div className="text-xs text-[var(--color-text-muted)] max-w-[280px] truncate">
                    UA: {e.userAgent}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                {e.ipAddress && <div>IP: {e.ipAddress}</div>}
                {showActions && !e.readAt && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="rounded bg-[var(--color-bg-alt)] px-3 py-1 font-semibold text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]/80">
                      Mark read
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusStrip({
  items,
}: {
  items: { label: string; status: string; detail?: string; href?: string }[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="rounded-xl border border-border bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{item.label}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--color-text-heading)]">{item.status}</div>
          {item.detail && <div className="text-xs text-[var(--color-text-muted)]">{item.detail}</div>}
        </a>
      ))}
    </div>
  );
}

function SystemCard() {
  const updates = [
    {
      title: "Reminder: verify your email",
      body: "Generate a link in Settings to finish verification and unlock login alerts.",
      href: "/settings",
    },
    {
      title: "New: notifications page",
      body: "Review security activity and go straight to Settings to adjust alerts.",
      href: "/notifications",
    },
  ];
  return (
    <div className="rounded-2xl border border-border bg-white">
      <div className="border-b border-border bg-[var(--color-bg-alt)] px-4 py-3">
        <div className="text-sm font-semibold text-[var(--color-text-heading)]">System updates</div>
        <div className="text-xs text-[var(--color-text-muted)]">Announcements and product tips.</div>
      </div>
      <ul className="divide-y">
        {updates.map((u) => (
          <li key={u.title} className="px-4 py-3">
            <div className="text-sm font-semibold text-[var(--color-text-heading)]">{u.title}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{u.body}</div>
            <a href={u.href} className="text-xs font-semibold text-[var(--color-accent-primary)]">
              Open
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
