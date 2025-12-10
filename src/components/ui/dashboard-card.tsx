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
        "rounded-2xl border border-[#E3E8EF] bg-[#FFFFFF] p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-[#1B1C1E]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-[#667085]">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div className="mt-4 border-t border-[#E3E8EF] pt-3 text-xs text-[#667085]">
          {footer}
        </div>
      )}
    </section>
  );
}
