"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = Record<string, number | string>;

type LineSeries = {
  dataKey: string;
  color: string;
  name?: string;
  strokeWidth?: number;
};

type Reference = {
  y: number;
  label?: string;
  color?: string;
  strokeDasharray?: string;
};

interface LineTrendChartProps<T extends ChartDatum> {
  data: T[];
  xKey: keyof T;
  yDomain?: [number, number];
  hideDots?: boolean;
  lines: LineSeries[];
  references?: Reference[];
}

export function LineTrendChart<T extends ChartDatum>({
  data,
  xKey,
  lines,
  yDomain,
  hideDots,
  references = [],
}: LineTrendChartProps<T>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full" suppressHydrationWarning />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border-subtle)" />
          <XAxis
            dataKey={xKey as string}
            stroke="var(--color-text-muted)"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={yDomain}
            stroke="var(--color-text-muted)"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card-light)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "0.75rem",
              fontSize: "12px",
            }}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth ?? 2}
              dot={hideDots ? false : { r: 4 }}
            />
          ))}
          {references.map((ref) => (
            <ReferenceLine
              key={`${ref.y}-${ref.label}`}
              y={ref.y}
              stroke={ref.color ?? "var(--color-accent-durability)"}
              strokeDasharray={ref.strokeDasharray ?? "4 4"}
              label={ref.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
