"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardCard } from "@/components/ui/dashboard-card";

type TrendPoint = {
  label: string;
  value: number;
};

export function StorageStabilityTrend({ data }: { data: TrendPoint[] }) {
  return (
    <DashboardCard
      title="Storage Stability Trend"
      description="Track Δ (%) across batches or formulations."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent-sustainability)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
