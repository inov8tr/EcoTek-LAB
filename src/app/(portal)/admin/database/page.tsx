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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-[var(--color-text-heading)]" htmlFor="table-search">
            Search tables
          </label>
          <input
            id="table-search"
            type="search"
            placeholder="e.g. user, session"
            className="w-64 rounded-lg border border-border px-3 py-2 text-sm"
            aria-describedby="table-search-help"
            onChange={(e) => {
              const term = e.target.value.toLowerCase();
              const list = document.querySelectorAll<HTMLAnchorElement>("#table-list a[data-table-name]");
              list.forEach((el) => {
                const name = el.dataset.tableName ?? "";
                const parent = el.parentElement;
                if (!parent) return;
                parent.style.display = name.includes(term) ? "" : "none";
              });
            }}
          />
          <span id="table-search-help" className="text-xs text-[var(--color-text-muted)]">
            Filter list below (client-side).
          </span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" id="table-list">
          {tables.map((t) => (
            <li key={t.table_name}>
              <Link
                href={`/admin/database/${encodeURIComponent(t.table_name)}` as Route}
                className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm font-semibold text-[var(--color-text-link)] transition hover:bg-gray-50"
                data-table-name={t.table_name.toLowerCase()}
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
