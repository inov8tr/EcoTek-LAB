import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type MetricStatus = "pass" | "fail";

interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  status?: MetricStatus;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  status,
  className,
}: MetricCardProps) {
  const formattedValue =
    Number.isInteger(value) || Math.abs(value) >= 10
      ? value.toFixed(0)
      : value.toFixed(1);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-[var(--color-card-light)] p-6 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-4xl font-semibold text-[var(--color-text-heading)]">
          {formattedValue}
          {unit}
        </p>
        {trend !== undefined && (
          <span
            className={cn(
              "text-sm font-medium",
              trend >= 0 ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
      {status && (
        <div className="mt-4">
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  );
}
