"use client";

import {
  Scatter,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { DashboardCard } from "@/components/ui/dashboard-card";

type PgPoint = {
  label: string;
  pgHigh: number;
  pgLow: number;
};

export function PgHighLowMap({ data }: { data: PgPoint[] }) {
  return (
    <DashboardCard
      title="PG High/Low Mapping"
      description="Compare PG high and low across formulas/batches."
    >
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <p className="text-sm text-[#667085]">No PG data recorded yet.</p>
        ) : (
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="#E3E8EF" />
              <XAxis type="number" dataKey="pgHigh" name="PG High" />
              <YAxis type="number" dataKey="pgLow" name="PG Low" />
              <ZAxis type="category" dataKey="label" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={data} fill="#24548F" />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
