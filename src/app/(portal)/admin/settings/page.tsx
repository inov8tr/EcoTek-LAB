import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";

export default async function AdminSettingsPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">System settings</h1>
        <p className="text-[var(--color-text-muted)]">
          Configure notifications, integrations, and retention policies. Additional toggles ship next sprint.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text-heading)]">Notifications</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Webhook + email alerts will route here in the next milestone.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text-heading)]">Integrations</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Connect EcoCap data lake, project trackers, or SSO providers. This panel serves as a placeholder until APIs are wired.
        </p>
      </div>
    </div>
  );
}
