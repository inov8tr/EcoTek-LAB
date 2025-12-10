import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  description,
  actions,
  children,
  footer,
  className,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-medium text-neutral-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-neutral-600">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div className="mt-4 border-t border-neutral-200 pt-3 text-xs text-neutral-600">
          {footer}
        </div>
      )}
    </section>
  );
}
