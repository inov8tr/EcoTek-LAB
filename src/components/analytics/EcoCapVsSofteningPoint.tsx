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

type Point = { ecoCap: number; softeningPoint: number; label?: string };

export function EcoCapVsSofteningPoint({ data }: { data: Point[] }) {
  return (
    <DashboardCard
      title="EcoCap % vs Softening Point"
      description="Explore how capsule loading affects softening point."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="ecoCap" name="EcoCap %" />
            <YAxis type="number" dataKey="softeningPoint" name="Softening (°C)" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              name="Softening"
              data={data}
              fill="var(--color-accent-cost)"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
