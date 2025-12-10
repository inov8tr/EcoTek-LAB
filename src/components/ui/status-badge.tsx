import { cn } from "@/lib/utils";

export type Status = "pass" | "fail" | "at-risk" | "on-track" | "complete";

const statusStyles: Record<Status, string> = {
  pass: "border-green-300 bg-green-100 text-green-800",
  fail: "border-red-300 bg-red-100 text-red-800",
  "at-risk": "border-yellow-300 bg-yellow-100 text-yellow-800",
  "on-track": "border-green-300 bg-green-100 text-green-800",
  complete: "border-neutral-300 bg-neutral-100 text-neutral-800",
};

interface StatusBadgeProps {
  status: Status;
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status]
      )}
    >
      {children ?? status.replace("-", " ")}
    </span>
  );
}
