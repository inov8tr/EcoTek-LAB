import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  highlightRow?: (item: T) => boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  className,
  emptyMessage = "No records found.",
  ariaLabel,
  highlightRow,
}: DataTableProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      {data.length === 0 && (
        <div className="rounded-md border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          {emptyMessage}
        </div>
      )}
      <div className="hidden overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm text-neutral-900" aria-label={ariaLabel}>
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="border-b border-neutral-200 px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-600"
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const rowKey =
                (item as { id?: string }).id ??
                (item as { batch?: string }).batch ??
                idx;
              const record = item as Record<string, unknown>;
              const isActive = highlightRow?.(item) ?? false;
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    "border-b border-neutral-100 transition-colors hover:bg-neutral-50",
                    isActive && "bg-neutral-100",
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key as string} className="px-4 py-3 text-sm">
                      {column.render
                        ? column.render(item)
                        : String(record[column.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {data.map((item, idx) => {
          const rowKey =
            (item as { id?: string }).id ??
            (item as { batch?: string }).batch ??
            idx;
          const record = item as Record<string, unknown>;
          const isActive = highlightRow?.(item) ?? false;
          return (
            <div
              key={`stacked-${rowKey}`}
              className={cn(
                "rounded-md border border-neutral-200 bg-white p-4 shadow-sm",
                isActive && "bg-neutral-100"
              )}
            >
              {columns.map((column) => (
                <div key={`stacked-${column.key as string}`} className="flex flex-col py-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {column.header}
                  </span>
                  <span className="text-sm text-neutral-900">
                    {column.render
                      ? column.render(item)
                      : String(record[column.key as string] ?? "")}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
