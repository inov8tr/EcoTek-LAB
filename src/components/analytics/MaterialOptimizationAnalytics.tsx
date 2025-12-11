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

export default function MaterialOptimizationAnalytics({
  initialTestSets = [],
  initialTestSetId = null,
}: {
  initialTestSets?: any[];
  initialTestSetId?: string | null;
}) {
  const [testSetId, setTestSetId] = useState<string | null>(initialTestSetId);
  const [metricType, setMetricType] = useState("SOFTENING_POINT");
  const [storageMethod, setStorageMethod] = useState<
    "RECOVERY" | "GSTAR" | "JNR" | "DELTA_SOFTENING"
  >("RECOVERY");
  const [variableKey, setVariableKey] = useState("capsule.sbsPercent");
  const [threshold, setThreshold] = useState<number | null>(null);

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

        const resp = await fetch("/api/analytics/optimization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testResultIds,
            metricType,
            variableKey,
            storageStabilityMethod: storageMethod,
            threshold,
          }),
        });

        const result = await resp.json();
        setPoints(result.data ?? []);
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [testSetId, metricType, variableKey, storageMethod, threshold]);

  const hasPoints = Array.isArray(points) && points.length > 0;
  const canTrend = hasPoints && points.length > 1;
  const trend = canTrend ? computeTrendline(points) : null;
  const chartWidth = Math.max(800, points.length * 80);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left control panel */}
      <div className="col-span-12 space-y-6 lg:col-span-3">
        <TestSetSelector
          value={testSetId}
          onChange={setTestSetId}
          initialSets={initialTestSets}
        />

        {/* Metric selector */}
        <div>
          <label className="text-sm font-medium">Target Metric</label>
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="mt-1 w-full rounded-md border p-2 text-sm"
          >
            <option value="SOFTENING_POINT">Softening Point</option>
            <option value="DUCTILITY_15">Ductility (15°C)</option>
            <option value="VISCOSITY_135">Viscosity (135°C)</option>
            <option value="ELASTIC_RECOVERY">Elastic Recovery</option>
            <option value="JNR">Jnr</option>
            <option value="PG_HIGH">PG High</option>
            <option value="PG_LOW">PG Low</option>
            <option value="STORAGE">Storage Stability</option>
          </select>
        </div>

        {/* Storage method (only shows if metric is STORAGE) */}
        {metricType === "STORAGE" && (
          <div>
            <label className="text-sm font-medium">Storage Method</label>
            <select
              value={storageMethod}
              onChange={(e) => setStorageMethod(e.target.value as any)}
              className="mt-1 w-full rounded-md border p-2 text-sm"
            >
              <option value="RECOVERY">Recovery-Based</option>
              <option value="GSTAR">DSR G* Based</option>
              <option value="JNR">Jnr-Based</option>
              <option value="DELTA_SOFTENING">Δ Softening</option>
            </select>
          </div>
        )}

        <VariableSelector value={variableKey} onChange={setVariableKey} />

        {/* Threshold input */}
        <div>
          <label className="text-sm font-medium">Threshold (optional)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border p-2 text-sm"
            value={threshold ?? ""}
            onChange={(e) => setThreshold(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>

        <ExportButtons targetId="material-optimization-chart" />
      </div>

      {/* Main chart */}
      <div
        id="material-optimization-chart"
        className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-9"
      >
        <h2 className="mb-4 text-lg font-semibold">
          Optimization: {metricType} vs {variableKey}
        </h2>

        {!testSetId ? (
          <p className="text-sm text-neutral-500">Select a Test Set to begin.</p>
        ) : loading ? (
          <p className="text-sm text-neutral-500">Loading data…</p>
        ) : !hasPoints ? (
          <p className="text-sm text-neutral-500">
            No data available for this configuration. Try adjusting the metric or variable.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ScatterChart width={chartWidth} height={400}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />

              {threshold !== null && (
                <ReferenceLine y={threshold} stroke="red" strokeDasharray="4 4" />
              )}

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
