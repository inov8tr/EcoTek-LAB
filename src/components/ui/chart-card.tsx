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
        "rounded-2xl border border-[#E3E8EF] bg-[#FFFFFF] p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-[#1B1C1E]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[#667085]">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
