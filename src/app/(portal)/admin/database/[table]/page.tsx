import { notFound } from "next/navigation";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import TableViewer from "@/components/admin/database/TableViewer";
import { Button } from "@/components/ui/button";
import { dbQuery } from "@/lib/db-proxy";

type PageProps = {
  params: Promise<{ table: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 25;

export default async function TablePage({ params, searchParams }: PageProps) {
  await requireRole([UserRole.ADMIN]);

  const resolvedParams = await params;
  const resolvedSearch = (await searchParams) ?? {};

  const tableParam = decodeURIComponent(resolvedParams.table);
  const tables = await dbQuery<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  );
  const tableNames = new Set(tables.map((t) => t.table_name));

  if (!tableNames.has(tableParam)) {
    notFound();
  }

  const columns = await dbQuery<{ column_name: string }>(
    [
      'SELECT column_name',
      "FROM information_schema.columns",
      "WHERE table_schema = 'public' AND table_name = $1",
      "ORDER BY ordinal_position",
    ].join(" "),
    [tableParam],
  );

  if (!columns.length) {
    notFound();
  }

  const page = parseInt(
    Array.isArray(resolvedSearch.page) ? resolvedSearch.page[0] : (resolvedSearch.page as string) ?? "1",
    10
  );
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const offset = (safePage - 1) * PAGE_SIZE;

  const sortParam =
    Array.isArray(resolvedSearch.sort) ? resolvedSearch.sort[0] : (resolvedSearch.sort as string | undefined);
  const dirParam =
    Array.isArray(resolvedSearch.dir) ? resolvedSearch.dir[0] : (resolvedSearch.dir as string | undefined);

  const validSort = columns.find((c) => c.column_name === sortParam)?.column_name ?? columns[0].column_name;
  const sortDirection = dirParam === "desc" ? "desc" : "asc";
  const sort = { id: validSort, desc: sortDirection === "desc" };

  const orderBy = `"${validSort}" ${sortDirection.toUpperCase()}`;
  const rows = await dbQuery(
    `SELECT * FROM "${tableParam}" ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
    [PAGE_SIZE, offset],
  );

  const countResult = await dbQuery<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM "${tableParam}"`,
  );
  const total = Number(countResult[0]?.count ?? 0);

  const columnKeys = columns.map((c) => c.column_name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Admin</p>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{tableParam}</h1>
          <p className="text-[var(--color-text-muted)]">Read-only view · public schema</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={"/admin/database" as Route}>Back to tables</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/api/admin/database/${encodeURIComponent(tableParam)}/export` as Route} aria-label="Export table as CSV">
            Export CSV
          </Link>
        </Button>
      </div>

      <TableViewer
        tableName={tableParam}
        columnKeys={columnKeys}
        data={rows as any[]}
        total={total}
        page={safePage}
        pageSize={PAGE_SIZE}
        sort={sort}
      />
    </div>
  );
}
