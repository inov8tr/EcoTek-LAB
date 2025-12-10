import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  asChild,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary/40",
    secondary: "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-700 hover:bg-neutral-100",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
