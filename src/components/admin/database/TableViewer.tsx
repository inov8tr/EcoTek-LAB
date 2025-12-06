"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

type TableViewerProps = {
  tableName: string;
  columnKeys: string[];
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  sort: { id: string; desc: boolean } | null;
};

export default function TableViewer({
  tableName,
  columnKeys,
  data,
  total,
  page,
  pageSize,
  sort,
}: TableViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      columnKeys.map((key) => ({
        id: key,
        accessorKey: key,
        header: key.replace(/_/g, " ").toUpperCase(),
      })),
    [columnKeys]
  );

  const sortingState: SortingState = sort ? [{ id: sort.id, desc: sort.desc }] : [];

  const navigate = (nextPage: number, nextSort: { id: string; desc: boolean } | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    if (nextSort) {
      params.set("sort", nextSort.id);
      params.set("dir", nextSort.desc ? "desc" : "asc");
    } else {
      params.delete("sort");
      params.delete("dir");
    }

    const query = params.toString();
    const target = `/admin/database/${encodeURIComponent(tableName)}${query ? `?${query}` : ""}`;
    router.replace(target as Route);
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      total={total}
      page={page}
      pageSize={pageSize}
      sorting={sortingState}
      onSortChange={(id, desc) => navigate(1, { id, desc })}
      onPageChange={(nextPage) => navigate(nextPage, sort)}
    />
  );
}
