import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  asChild?: boolean;
}

export function Button({
  className,
  children,
  variant = "primary",
  asChild,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90",
    outline:
      "border border-border text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]",
    ghost:
      "text-[var(--color-text-heading)] hover:bg-[var(--color-bg-alt)]/80",
  };

  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
