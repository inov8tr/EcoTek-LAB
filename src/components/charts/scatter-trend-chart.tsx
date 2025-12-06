"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScatterDatum = Record<string, number | string>;

interface ScatterTrendChartProps<T extends ScatterDatum> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  xLabel?: string;
  yLabel?: string;
  referenceLine?: number;
}

export function ScatterTrendChart<T extends ScatterDatum>({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  referenceLine,
}: ScatterTrendChartProps<T>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full" suppressHydrationWarning />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border-subtle)" />
          <XAxis
            type="number"
            dataKey={xKey as string}
            name={xLabel}
            stroke="var(--color-text-muted)"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey={yKey as string}
            name={yLabel}
            stroke="var(--color-text-muted)"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: "var(--color-card-light)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "0.75rem",
              fontSize: "12px",
            }}
          />
          {referenceLine !== undefined && (
            <ReferenceLine
              y={referenceLine}
              stroke="var(--color-accent-durability)"
              strokeDasharray="4 4"
            />
          )}
          <Scatter
            data={data}
            fill="var(--color-accent-storability)"
            line={{ stroke: "var(--color-accent-storability)" }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
