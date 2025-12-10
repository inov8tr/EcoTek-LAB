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

type ViscosityPoint = {
  label: string;
  viscosity135: number;
  viscosity165: number;
};

export function ViscosityCurves({ data }: { data: ViscosityPoint[] }) {
  return (
    <DashboardCard
      title="Viscosity Curves"
      description="Viscosity at 135°C vs 165°C across batches."
    >
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <p className="text-sm text-[#667085]">No viscosity data recorded yet.</p>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="viscosity135"
                stroke="#24548F"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#24548F" }}
                name="Viscosity @135°C"
              />
              <Line
                type="monotone"
                dataKey="viscosity165"
                stroke="#2FA94B"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#2FA94B" }}
                name="Viscosity @165°C"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
