"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarSerie {
  dataKey: string;
  name: string;
  color: string;
}

type RadarDatum = Record<string, number | string>;

interface RadarComparisonChartProps<T extends RadarDatum> {
  data: T[];
  categoryKey: keyof T;
  series: RadarSerie[];
}

export function RadarComparisonChart<T extends RadarDatum>({
  data,
  categoryKey,
  series,
}: RadarComparisonChartProps<T>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-80 w-full" suppressHydrationWarning />;
  }

  const numericValues = data.flatMap((item) =>
    series.map((serie) => Number(item[serie.dataKey] ?? 0)),
  );
  const candidate = numericValues.length ? Math.max(...numericValues) : 100;
  const axisMax =
    candidate <= 0 ? 10 : Math.max(10, Math.ceil(candidate / 10) * 10);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--color-border-subtle)" />
          <PolarAngleAxis
            dataKey={categoryKey as string}
            tick={{ fontSize: 12 }}
            stroke="var(--color-text-muted)"
          />
          <PolarRadiusAxis
            domain={[0, axisMax]}
            tick={{ fontSize: 10 }}
            stroke="var(--color-text-muted)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card-light)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "0.75rem",
              fontSize: "12px",
            }}
          />
          {series.map((serie) => (
            <Radar
              key={serie.dataKey}
              name={serie.name}
              dataKey={serie.dataKey}
              stroke={serie.color}
              fill={serie.color}
              fillOpacity={0.15}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
