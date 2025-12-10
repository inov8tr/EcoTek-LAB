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

type DsrPoint = {
  temperature: number;
  gOverSinDelta: number;
};

export function DsrTrend({ data }: { data: DsrPoint[] }) {
  return (
    <DashboardCard
      title="DSR G*/sinδ vs Temperature"
      description="Rheological performance across test temperatures."
    >
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <p className="text-sm text-[#667085]">No DSR data recorded yet.</p>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
              <XAxis dataKey="temperature" tick={{ fontSize: 12 }} unit="°C" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="gOverSinDelta"
                stroke="#24548F"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#24548F" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
