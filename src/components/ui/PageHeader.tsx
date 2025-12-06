import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
  actions,
}: {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
          EcoTek
        </p>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{title}</h1>
        {description && <p className="text-sm text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
