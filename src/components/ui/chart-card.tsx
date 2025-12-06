import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  className,
  children,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-[var(--color-card-light)] p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
