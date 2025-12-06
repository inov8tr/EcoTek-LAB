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

type RadarDatum = Record<string, number | string>;

interface RadarComplianceChartProps<T extends RadarDatum> {
  data: T[];
  metricKey: keyof T;
  valueKey: keyof T;
  requirementKey: keyof T;
}

export function RadarComplianceChart<T extends RadarDatum>({
  data,
  metricKey,
  valueKey,
  requirementKey,
}: RadarComplianceChartProps<T>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full" suppressHydrationWarning />;
  }

  const numericValues = data.flatMap((item) => [
    Number(item[valueKey] ?? 0),
    Number(item[requirementKey] ?? 0),
  ]);
  const maxValueCandidate = numericValues.length ? Math.max(...numericValues) : 100;
  const axisMax =
    maxValueCandidate <= 0
      ? 10
      : Math.max(10, Math.ceil(maxValueCandidate / 10) * 10);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="var(--color-border-subtle)" />
          <PolarAngleAxis
            dataKey={metricKey as string}
            tick={{ fontSize: 11 }}
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
          <Radar
            name="Requirement"
            dataKey={requirementKey as string}
            stroke="var(--color-accent-durability)"
            fill="var(--color-accent-durability)"
            fillOpacity={0.15}
          />
          <Radar
            name="Actual"
            dataKey={valueKey as string}
            stroke="var(--color-accent-recovery)"
            fill="var(--color-accent-recovery)"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
