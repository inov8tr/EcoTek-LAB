import { RequirementComparison, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createMarket, createStandard, createRequirement } from "./actions";

const comparisonOptions = [
  { value: "LTE", label: "≤" },
  { value: "GTE", label: "≥" },
  { value: "BETWEEN", label: "Between" },
] satisfies { value: RequirementComparison; label: string }[];

const knownMetrics = [
  "storabilityPct",
  "elasticRecoveryPct",
  "jnr_3_2",
  "softeningPointC",
  "ductilityCm",
  "viscosity155c",
  "solubilityPct",
] as const;

export default async function StandardsAdminPage() {
  await requireRole([UserRole.ADMIN]);
  const markets = await prisma.market.findMany({
    orderBy: { name: "asc" },
    include: {
      standards: {
        orderBy: { name: "asc" },
        include: { requirements: true },
      },
    },
  });
  const standards = markets.flatMap((market) => market.standards);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Markets & standards</h1>
        <p className="text-[var(--color-text-muted)]">
          Add new regions, configure PMA standards, and manage requirement thresholds.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <AdminCard title="Add market" action={createMarket}>
          <input
            name="code"
            placeholder="KR"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            required
          />
          <input
            name="name"
            placeholder="Korea"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            required
          />
          <SubmitButton label="Save market" />
        </AdminCard>

        <AdminCard title="Add standard" action={createStandard}>
          <select
            name="marketId"
            required
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          >
            <option value="">Select market</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name}
              </option>
            ))}
          </select>
          <input
            name="code"
            placeholder="KR_PG82_22"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            required
          />
          <input
            name="name"
            placeholder="Korean PMA PG82-22"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            required
          />
          <textarea
            name="description"
            rows={3}
            placeholder="Description"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          />
          <SubmitButton label="Save standard" />
        </AdminCard>

        <AdminCard title="Add requirement" action={createRequirement}>
          <select
            name="standardId"
            required
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          >
            <option value="">Select standard</option>
            {standards.map((standard) => (
              <option key={standard.id} value={standard.id}>
                {standard.code}
              </option>
            ))}
          </select>
          <select
            name="metric"
            required
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          >
            <option value="">Metric</option>
            {knownMetrics.map((metric) => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
          <select
            name="comparison"
            required
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          >
            {comparisonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.value})
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <input
              name="thresholdMin"
              type="number"
              step="0.01"
              placeholder="Min"
              className="w-full rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
            <input
              name="thresholdMax"
              type="number"
              step="0.01"
              placeholder="Max"
              className="w-full rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
          <input
            name="unit"
            placeholder="Unit"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          />
          <textarea
            name="notes"
            rows={3}
            placeholder="Notes"
            className="rounded-xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          />
          <SubmitButton label="Add requirement" />
        </AdminCard>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-heading)]">Configured standards</h2>
        <div className="space-y-4">
          {markets.map((market) => (
            <div key={market.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.3em]">
                {market.code}
              </h3>
              <p className="text-xl font-semibold text-[var(--color-text-heading)]">{market.name}</p>
              <div className="mt-4 space-y-3">
                {market.standards.map((standard) => (
                  <div key={standard.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-heading)]">
                          {standard.code}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">{standard.name}</p>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {standard.requirements.length} requirements
                      </p>
                    </div>
                    {standard.requirements.length > 0 && (
                      <table className="mt-3 w-full table-auto text-sm">
                        <thead className="text-left text-[var(--color-text-muted)]">
                          <tr>
                            <th className="py-1">Metric</th>
                            <th className="py-1">Comparison</th>
                            <th className="py-1">Thresholds</th>
                            <th className="py-1">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standard.requirements.map((requirement) => (
                            <tr key={requirement.id} className="border-t border-border/60">
                              <td className="py-2 font-semibold text-[var(--color-text-heading)]">
                                {requirement.metric}
                              </td>
                              <td className="py-2">{requirement.comparison}</td>
                              <td className="py-2">
                                {requirement.thresholdMin ?? "—"} / {requirement.thresholdMax ?? "—"}
                              </td>
                              <td className="py-2">{requirement.unit ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
                {market.standards.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)]">No standards defined for this market.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminCard({
  title,
  action,
  children,
}: {
  title: string;
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="space-y-3 rounded-xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">{title}</h3>
      {children}
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white"
    >
      {label}
    </button>
  );
}
