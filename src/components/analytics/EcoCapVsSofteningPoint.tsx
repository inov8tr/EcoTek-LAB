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
        {data.length === 0 ? (
          <p className="text-sm text-[#667085]">No softening point readings yet.</p>
        ) : (
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
              <XAxis type="number" dataKey="ecoCap" name="EcoCap %" />
              <YAxis type="number" dataKey="softeningPoint" name="Softening (°C)" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                name="Softening"
                data={data}
                fill="#6F56E8"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
