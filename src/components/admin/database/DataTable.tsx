"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from "lucide-react";

type DataTableProps = {
  columns: ColumnDef<any>[];
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  sorting?: SortingState;
  onSortChange?: (columnId: string, desc: boolean) => void;
  onPageChange?: (page: number) => void;
};

export function DataTable({
  columns,
  data,
  total,
  page,
  pageSize,
  sorting = [],
  onSortChange,
  onPageChange,
}: DataTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    manualSorting: true,
    manualPagination: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      const next = nextSorting[0];
      if (next && onSortChange) {
        onSortChange(next.id, !!next.desc);
      }
    },
  });

  const canPrevious = page > 1;
  const canNext = page < pageCount;

  return (
    <div className="space-y-3 rounded-xl border border-border-subtle bg-white/80 p-4 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-subtle">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = sorting.find((s) => s.id === header.column.id);
                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap border-b border-border-subtle px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={() => header.column.toggleSorting()}
                          className="inline-flex items-center gap-1"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSorted ? (
                            isSorted.desc ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUp className="h-3.5 w-3.5" />
                            )
                          ) : null}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => {
                  const renderer =
                    cell.column.columnDef.cell ??
                    ((ctx: any) => flexRender(cell.column.columnDef.header, ctx));
                  return (
                    <td key={cell.id} className="whitespace-nowrap px-3 py-2 text-sm text-[var(--color-text-main)]">
                      {flexRender(renderer, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-sm text-[var(--color-text-muted)]" colSpan={columns.length}>
                  No rows found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
        <div>
          Page {page} of {pageCount} · Showing {data.length} of {total} rows
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!canPrevious}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!canNext}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
