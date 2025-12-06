import { cn } from "@/lib/utils";

export type Status = "pass" | "fail" | "at-risk" | "on-track" | "complete";

const statusStyles: Record<Status, string> = {
  pass: "bg-[var(--color-status-pass-bg)] text-[var(--color-status-pass-text)]",
  fail: "bg-[var(--color-status-fail-bg)] text-[var(--color-status-fail-text)]",
  "at-risk": "bg-amber-100 text-amber-700",
  "on-track": "bg-emerald-100 text-emerald-700",
  complete: "bg-slate-900 text-white",
};

interface StatusBadgeProps {
  status: Status;
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        statusStyles[status]
      )}
    >
      {children ?? status.replace("-", " ")}
    </span>
  );
}
