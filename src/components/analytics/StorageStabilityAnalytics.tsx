"use client";

import { useEffect, useState } from "react";
import VariableSelector from "./VariableSelector";
import TestSetSelector from "./TestSetSelector";
import ExportButtons from "./ExportButtons";
import { computeTrendline } from "./useTrendline";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export default function StorageStabilityAnalytics({
  initialTestSets = [],
  initialTestSetId = null,
}: {
  initialTestSets?: any[];
  initialTestSetId?: string | null;
}) {
  const [testSetId, setTestSetId] = useState<string | null>(initialTestSetId);
  const [method, setMethod] = useState<"RECOVERY" | "GSTAR" | "JNR" | "DELTA_SOFTENING">(
    "RECOVERY"
  );
  const [variableKey, setVariableKey] = useState("capsule.sbsPercent");
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTestSetId) {
      setTestSetId(initialTestSetId);
    }
  }, [initialTestSetId]);

  useEffect(() => {
    if (!testSetId) return;
    setLoading(true);

    fetch("/api/analysis-sets/get-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setId: testSetId }),
    })
      .then((res) => res.json())
      .then(async (json) => {
        const testResultIds = json.data;
        const resp = await fetch("/api/analytics/storage-stability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testResultIds, method, variableKey }),
        });
        const result = await resp.json();
        setPoints(result.data ?? []);
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [testSetId, method, variableKey]);

  const hasPoints = Array.isArray(points) && points.length > 0;
  const canTrend = hasPoints && points.length > 1;
  const trend = canTrend ? computeTrendline(points) : null;
  const chartWidth = Math.max(800, points.length * 80);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left controls */}
      <div className="col-span-12 space-y-6 lg:col-span-3">
        <TestSetSelector
          value={testSetId}
          onChange={setTestSetId}
          initialSets={initialTestSets}
        />

        {/* Method selector */}
        <div>
          <label className="text-sm font-medium">Stability Method</label>
          <select
            className="mt-1 w-full rounded-md border p-2 text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
          >
            <option value="RECOVERY">Recovery-Based</option>
            <option value="GSTAR">DSR G* Based</option>
            <option value="JNR">Jnr-Based</option>
            <option value="DELTA_SOFTENING">Δ Softening Point</option>
          </select>
        </div>

        <VariableSelector value={variableKey} onChange={setVariableKey} />

        <ExportButtons targetId="storage-stability-chart" />
      </div>

      {/* Chart */}
      <div
        id="storage-stability-chart"
        className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-9"
      >
        <h2 className="mb-4 text-lg font-semibold">Storage Stability vs {variableKey}</h2>

        {!testSetId ? (
          <p className="text-sm text-neutral-500">Select a Test Set to begin.</p>
        ) : loading ? (
          <p className="text-sm text-neutral-500">Loading data…</p>
        ) : !hasPoints ? (
          <p className="text-sm text-neutral-500">
            No data available for this configuration. Try a different set or variable.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ScatterChart width={chartWidth} height={400}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Variable" />
              <YAxis dataKey="y" name="Stability (%)" />
              <Tooltip />

              <ReferenceLine y={5} stroke="red" strokeDasharray="4 4" />

              {trend && canTrend && (
                <ReferenceLine
                  segment={[
                    { x: points[0].x, y: trend.slope * points[0].x + trend.intercept },
                    {
                      x: points[points.length - 1].x,
                      y: trend.slope * points[points.length - 1].x + trend.intercept,
                    },
                  ]}
                  stroke="blue"
                />
              )}

              <Scatter data={points} fill="#0a6aa4" line shape="circle" />
            </ScatterChart>
          </div>
        )}
      </div>
    </div>
  );
}
