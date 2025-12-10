import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";

const tiles: Array<{ href: string; title: string; description: string }> = [
  {
    href: "/admin/users",
    title: "User approvals",
    description: "Review pending accounts, assign roles, and suspend compromised access.",
  },
  {
    href: "/admin/deletion-requests",
    title: "Deletion requests",
    description: "Approve or reject removal requests submitted by researchers.",
  },
  {
    href: "/admin/standards",
    title: "Standards & markets",
    description: "Manage KR / JP / CN compliance thresholds and add new markets.",
  },
  {
    href: "/admin/settings",
    title: "System settings",
    description: "Portal-level configuration, integrations, and audit exports.",
  },
];

export default async function AdminHomePage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Admin console</h1>
        <p className="text-[var(--color-text-muted)]">Centralized controls for authentication, standards, and automation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href as Route}
            className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">EcoTek admin</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--color-text-heading)]">{tile.title}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-main)]">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
