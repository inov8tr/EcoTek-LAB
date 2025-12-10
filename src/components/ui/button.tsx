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
      "bg-[#24548F] text-white hover:bg-[#1D4475]",
    outline:
      "border border-[#D0D5DD] bg-[#FFFFFF] text-[#2E2F31] hover:bg-[#F6F7FA]",
    ghost:
      "text-[#2E2F31] hover:bg-[#F2F4F7]",
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
