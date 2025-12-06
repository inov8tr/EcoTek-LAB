import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
        {subtitle}
      </p>
      <h2 className="text-2xl font-semibold text-[var(--color-text-heading)]">{title}</h2>
    </div>
  );
}
