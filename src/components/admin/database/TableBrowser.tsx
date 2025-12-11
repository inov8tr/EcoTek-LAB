"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

export function TableBrowser({ tables }: { tables: string[] }) {
  const [term, setTerm] = useState("");
  const filtered = useMemo(() => {
    const lowered = term.toLowerCase();
    if (!lowered) return tables;
    return tables.filter((table) => table.toLowerCase().includes(lowered));
  }, [tables, term]);

  return (
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
          value={term}
          autoComplete="off"
          onChange={(event) => setTerm(event.target.value)}
        />
        <span id="table-search-help" className="text-xs text-[var(--color-text-muted)]">
          Filter list below (client-side).
        </span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((table) => (
          <li key={table}>
            <Link
              href={`/admin/database/${encodeURIComponent(table)}` as Route}
              className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm font-semibold text-[var(--color-text-link)] transition hover:bg-gray-50"
            >
              {table}
              <span aria-hidden>→</span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="col-span-full rounded-lg border border-dashed border-border-subtle px-3 py-4 text-sm text-[var(--color-text-muted)]">
            No tables found.
          </li>
        )}
      </ul>
    </div>
  );
}
