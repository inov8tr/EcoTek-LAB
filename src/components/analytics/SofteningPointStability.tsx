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

type SofteningPoint = {
  label: string;
  softeningPoint: number;
};

export function SofteningPointStability({ data }: { data: SofteningPoint[] }) {
  return (
    <DashboardCard
      title="Softening Point Stability"
      description="Softening point across recent batches."
    >
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <p className="text-sm text-[#667085]">No softening point data yet.</p>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="softeningPoint"
                stroke="#6F56E8"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#6F56E8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
