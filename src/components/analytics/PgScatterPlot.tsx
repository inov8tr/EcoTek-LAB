"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardCard } from "@/components/ui/dashboard-card";

type Point = { pgHigh: number; pgLow: number; label?: string };

export function PgScatterPlot({ data }: { data: Point[] }) {
  return (
    <DashboardCard
      title="PG Performance Scatter"
      description="Plot PG high/low across batches or formulations."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="pgHigh" name="PG High" />
            <YAxis type="number" dataKey="pgLow" name="PG Low" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="PG" data={data} fill="var(--color-accent-sustainability)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
