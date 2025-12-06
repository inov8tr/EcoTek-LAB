import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "subtle";

const styles: Record<Variant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  subtle: "border-transparent bg-muted text-muted-foreground",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant, ...props }: BadgeProps) {
  const applied = styles[variant ?? "default"];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        applied,
        className
      )}
      {...props}
    />
  );
}
