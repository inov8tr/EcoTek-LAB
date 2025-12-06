import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[var(--color-bg-alt)] px-6 py-10 text-center">
      {icon && <div className="text-[var(--color-text-muted)]">{icon}</div>}
      <div className="text-base font-semibold text-[var(--color-text-heading)]">{title}</div>
      {description && <p className="max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>}
      {actions && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
