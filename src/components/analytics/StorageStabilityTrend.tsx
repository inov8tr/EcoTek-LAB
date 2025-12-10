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
        {data.length === 0 ? (
          <p className="text-sm text-[#667085]">No stability data recorded yet.</p>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2FA94B"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#2FA94B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
