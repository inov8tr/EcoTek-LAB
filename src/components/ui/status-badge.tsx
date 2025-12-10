import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  success: "border border-[#A2D5AB] bg-[#E8F5E9] text-[#1E7E34]",
  warning: "border border-[#F4D988] bg-[#FFF8E6] text-[#B86100]",
  error: "border border-[#F5A9A1] bg-[#FDECEA] text-[#B42318]",
  neutral: "border border-[#E3E8EF] bg-[#F2F4F7] text-[#667085]",
};

type StatusBadgeProps =
  | {
      status: string;
      variant?: never;
      label?: string;
      icon?: React.ReactNode;
      className?: string;
    }
  | {
      status?: never;
      variant: BadgeVariant;
      label: string;
      icon?: React.ReactNode;
      className?: string;
    };

function normalizeStatus(status?: string) {
  return status?.toLowerCase().replace(/_/g, "-") ?? "";
}

function mapStatusToVariant(status?: string): { variant: BadgeVariant; label: string } {
  const normalized = normalizeStatus(status);
  if (["pass", "complete", "on-track", "active", "approved", "success"].includes(normalized)) {
    return { variant: "success", label: status ?? "Success" };
  }
  if (["fail", "failed", "error", "rejected", "blocked"].includes(normalized)) {
    return { variant: "error", label: status ?? "Fail" };
  }
  if (["at-risk", "warning", "pending", "pending-review", "review"].includes(normalized)) {
    return { variant: "warning", label: status ?? "Pending" };
  }
  return { variant: "neutral", label: status ?? "Status" };
}

export function StatusBadge(props: StatusBadgeProps) {
  const { variant, label } =
    "status" in props
      ? mapStatusToVariant(props.status)
      : { variant: props.variant, label: props.label };

  const badgeLabel = ("status" in props && props.label) || label;
  const icon = props.icon ?? <span className="h-2 w-2 rounded-full bg-current" aria-hidden />;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        props.className
      )}
    >
      {icon}
      <span className="capitalize">{badgeLabel}</span>
    </span>
  );
}
