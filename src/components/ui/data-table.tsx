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
}

export function DataTable<T extends object>({
  columns,
  data,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="hidden overflow-x-auto rounded-2xl border border-[#E3E8EF] bg-[#FFFFFF] md:block">
        <table className="w-full table-auto text-left">
          <thead className="bg-[#F2F4F7] text-[#667085]">
            <tr className="text-xs uppercase tracking-wide">
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="px-4 py-3 font-semibold border-b border-[#E3E8EF]"
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
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    "border-b border-[#E3E8EF] bg-[#FFFFFF] transition-colors hover:bg-[#F6F7FA]",
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key as string} className="px-4 py-3 text-sm text-[#2E2F31]">
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
          return (
            <div
              key={`stacked-${rowKey}`}
              className="rounded-2xl border border-[#E3E8EF] bg-[#FFFFFF] p-4 shadow-sm"
            >
              {columns.map((column) => (
                <div key={`stacked-${column.key as string}`} className="flex flex-col py-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#667085]">
                    {column.header}
                  </span>
                  <span className="text-sm text-[#1B1C1E]">
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
