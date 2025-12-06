import Link from "next/link";
import type { Route } from "next";
import { getCurrentUser } from "@/lib/auth-helpers";

const STATUS_COPY: Record<string, string> = {
  ACTIVE: "You have full access to the EcoTek R&D Portal.",
  PENDING: "Your account is pending admin approval. You will receive an email once activated.",
  SUSPENDED: "This account has been suspended. Contact an administrator for assistance.",
};

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const statusDescription = STATUS_COPY[currentUser.status] ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">My Account</h1>
        <p className="text-[var(--color-text-muted)]">Manage your profile and approval status.</p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <dl className="grid gap-6 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
              Name
            </dt>
            <dd className="text-xl font-semibold text-[var(--color-text-heading)]">
              {currentUser.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
              Email
            </dt>
            <dd className="text-xl font-semibold text-[var(--color-text-heading)]">
              {currentUser.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
              Role
            </dt>
            <dd className="text-xl font-semibold text-[var(--color-text-heading)]">
              {currentUser.role}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
              Status
            </dt>
            <dd className="text-xl font-semibold text-[var(--color-text-heading)]">
              {currentUser.status}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-[var(--color-text-main)]">{statusDescription}</p>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-[var(--color-bg-alt)]/70 p-6 text-sm text-[var(--color-text-main)]">
        <p>
          Need elevated permissions? Open an internal ticket or reach out in{" "}
          <Link href={"/admin/users" as Route} className="font-semibold text-[var(--color-text-link)]">
            the admin console
          </Link>{" "}
          to update your role.
        </p>
      </section>
    </div>
  );
}
