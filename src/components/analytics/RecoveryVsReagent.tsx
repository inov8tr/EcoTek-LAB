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

type Point = { reagent: number; recovery: number; label?: string };

export function RecoveryVsReagent({ data }: { data: Point[] }) {
  return (
    <DashboardCard
      title="Recovery vs Reagent %"
      description="Visualize elastic recovery against reagent loading."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="reagent" name="Reagent %" />
            <YAxis type="number" dataKey="recovery" name="Recovery %" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              name="Recovery"
              data={data}
              fill="var(--color-accent-sustainability)"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
