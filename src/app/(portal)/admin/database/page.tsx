import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export default async function AdminDatabasePage() {
  await requireRole([UserRole.ADMIN]);

  const tables =
    await prisma.$queryRaw<{ table_name: string }[]>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Database tables</h1>
        <p className="text-[var(--color-text-muted)]">Browse public schema tables. Reads only.</p>
      </div>

      <div className="rounded-xl border border-border-subtle bg-white/80 p-4 shadow-sm">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <li key={t.table_name}>
              <Link
                href={`/admin/database/${encodeURIComponent(t.table_name)}` as Route}
                className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm font-semibold text-[var(--color-text-link)] transition hover:bg-gray-50"
              >
                {t.table_name}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
