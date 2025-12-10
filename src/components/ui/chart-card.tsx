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
        "rounded-md border border-neutral-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-medium text-neutral-900">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-neutral-600">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
