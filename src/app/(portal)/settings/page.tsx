import { UserRole } from "@prisma/client";
import { getDatabaseStatus } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

export default async function SettingsPage() {
  await requireRole([UserRole.ADMIN]);
  const dbStatus = await getDatabaseStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Settings</h1>
        <p className="text-[var(--color-text-muted)]">
          Configure integrations, database connections, and notification policies.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Database</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          PostgreSQL connection string is read from <code>DATABASE_URL</code>.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-heading)]">Status</p>
            <p className="text-sm text-[var(--color-text-muted)]">{dbStatus.message}</p>
          </div>
          <span
            className={`rounded-full px-4 py-1 text-xs font-semibold ${
              dbStatus.connected
                ? "bg-[var(--color-status-pass-bg)] text-[var(--color-status-pass-text)]"
                : "bg-[var(--color-status-fail-bg)] text-[var(--color-status-fail-text)]"
            }`}
          >
            {dbStatus.connected ? "Connected" : "Offline"}
          </span>
        </div>
      </section>
    </div>
  );
}
