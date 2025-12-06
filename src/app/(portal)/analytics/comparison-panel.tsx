"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/ui/chart-card";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { RadarComparisonChart } from "@/components/charts/radar-comparison-chart";

const SERIES_COLORS = [
  "var(--color-accent-recovery)",
  "var(--color-accent-storability)",
  "var(--color-accent-jnr)",
  "var(--color-accent-durability)",
  "#7C3AED",
];

interface ComparisonPanelProps {
  formulations: string[];
  recoveryData: Record<string, number | string>[];
  storabilityData: Record<string, number | string>[];
  radarData: Record<string, number | string>[];
  insights: string[];
}

export function ComparisonPanel({
  formulations,
  recoveryData,
  storabilityData,
  radarData,
  insights,
}: ComparisonPanelProps) {
  const [selected, setSelected] = useState(() =>
    formulations.slice(0, Math.min(2, formulations.length))
  );
  const lineSeries = useMemo(
    () =>
      selected.map((name, index) => ({
        dataKey: name,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        name,
      })),
    [selected]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
        <label className="text-sm font-semibold text-[var(--color-text-heading)]">
          Compare formulations
        </label>
        <p className="text-xs text-[var(--color-text-muted)]">
          Hold Cmd/Ctrl to select more than one formulation.
        </p>
        <select
          multiple
          value={selected}
          onChange={(event) => {
            const optionsArray = Array.from(event.target.selectedOptions);
            const values = optionsArray.map((opt) => opt.value);
            const fallback = formulations[0] ? [formulations[0]] : [];
            setSelected(values.length ? values : fallback);
          }}
          className="mt-3 w-full rounded-2xl border border-border bg-white p-3 text-sm shadow-sm"
        >
          {formulations.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Elastic Recovery Comparison"
          description="Each series represents a formulation."
        >
          <LineTrendChart
            data={recoveryData}
            xKey="batch"
            lines={lineSeries}
            yDomain={[70, 100]}
          />
        </ChartCard>

        <ChartCard title="Storability vs Batches" description="Regulatory limit shown at 5%.">
          <LineTrendChart
            data={storabilityData}
            xKey="batch"
            lines={lineSeries}
            yDomain={[0, 6]}
            references={[{ y: 5, label: "5% Limit" }]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChartCard title="Multi-formulation Radar" description="Higher is better across metrics.">
          <RadarComparisonChart
            data={radarData}
            categoryKey="metric"
            series={lineSeries.map((serie) => ({
              ...serie,
              dataKey: serie.dataKey,
            }))}
          />
        </ChartCard>

        <ChartCard title="Insights" description="Surface-level guidance to review.">
          <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
            {insights.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
