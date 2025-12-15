export const runtime = "nodejs";

import { requireStatus } from "@/lib/auth-helpers";
import { UserStatus } from "@prisma/client";
import { dbQuery } from "@/lib/db-proxy";
import { submitSupportRequest } from "./actions";

export default async function SupportPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireStatus(UserStatus.ACTIVE);
  const params = await searchParams;
  const success = typeof params?.success === "string" ? params.success : null;
  const error = typeof params?.error === "string" ? params.error : null;

  const recent = await dbQuery<{
    id: string;
    subject: string;
    status: string;
    message: string;
    createdAt: string;
  }>(
    [
      'SELECT "id", "subject", "status", "message", "createdAt"',
      'FROM "SupportRequest"',
      'WHERE "userId" = $1',
      'ORDER BY "createdAt" DESC',
      "LIMIT 5",
    ].join(" "),
    [user.id],
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Help & Support</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Contact support</h1>
        <p className="text-[var(--color-text-muted)]">Send a request to the team. We’ll reply by email.</p>
      </div>

      {(success || error) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${success ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {success ?? error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={submitSupportRequest} className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Subject</label>
            <input
              name="subject"
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="e.g. Trouble uploading binder tests"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Severity</label>
            <select name="severity" className="w-full rounded-lg border border-border px-3 py-2 text-sm" defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Message</label>
            <textarea
              name="message"
              required
              rows={5}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Describe the issue, steps to reproduce, and expected behavior."
            />
          </div>
          <button className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
            Submit request
          </button>
        </form>

        <div className="space-y-3 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-heading)]">Your recent requests</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Last 5 submissions.</p>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No requests yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-[var(--color-text-heading)]">
                    <span>{r.subject}</span>
                    <span className={`text-xs uppercase ${r.status === "open" ? "text-green-700" : "text-[var(--color-text-muted)]"}`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {new Date(r.createdAt).toLocaleString()} · {r.message.slice(0, 140)}{r.message.length > 140 ? "…" : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-lg border border-dashed border-border bg-[var(--color-bg-alt)]/60 px-3 py-2 text-xs text-[var(--color-text-muted)]">
            We’ll respond via email. For urgent issues, mark severity as “Urgent” and include impact.
          </div>
        </div>
      </div>
    </div>
  );
}
