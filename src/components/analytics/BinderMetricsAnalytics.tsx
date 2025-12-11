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

export default function BinderMetricsAnalytics({
  initialTestSets = [],
  initialTestSetId = null,
}: {
  initialTestSets?: any[];
  initialTestSetId?: string | null;
}) {
  const [testSetId, setTestSetId] = useState<string | null>(initialTestSetId);
  const [metricType, setMetricType] = useState("SOFTENING_POINT");
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

        const resp = await fetch("/api/analytics/binder-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testResultIds, metricType, variableKey }),
        });

        const result = await resp.json();
        setPoints(result.data ?? []);
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [testSetId, metricType, variableKey]);

  const hasPoints = Array.isArray(points) && points.length > 0;
  const canTrend = hasPoints && points.length > 1;
  const trend = canTrend ? computeTrendline(points) : null;
  const chartWidth = Math.max(800, points.length * 80);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 lg:col-span-3">
        <TestSetSelector
          value={testSetId}
          onChange={setTestSetId}
          initialSets={initialTestSets}
        />

        {/* Metric selector */}
        <div>
          <label className="text-sm font-medium">Binder Metric</label>
          <select
            className="mt-1 w-full rounded-md border p-2 text-sm"
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
          >
            <option value="SOFTENING_POINT">Softening Point</option>
            <option value="DUCTILITY_15">Ductility (15°C)</option>
            <option value="DUCTILITY_25">Ductility (25°C)</option>
            <option value="VISCOSITY_135">Viscosity (135°C)</option>
            <option value="ELASTIC_RECOVERY">Elastic Recovery</option>
            <option value="JNR">Jnr</option>
            <option value="SOLUBILITY">Solubility</option>
            <option value="PG_HIGH">PG High</option>
            <option value="PG_LOW">PG Low</option>
          </select>
        </div>

        <VariableSelector value={variableKey} onChange={setVariableKey} />

        <ExportButtons targetId="binder-metrics-chart" />
      </div>

      <div
        id="binder-metrics-chart"
        className="col-span-12 rounded-xl bg-white p-4 shadow-sm lg:col-span-9"
      >
        <h2 className="mb-4 text-lg font-semibold">
          {metricType} vs {variableKey}
        </h2>

        {!testSetId ? (
          <p className="text-sm text-neutral-500">Select a Test Set to begin.</p>
        ) : loading ? (
          <p className="text-sm text-neutral-500">Loading data…</p>
        ) : !hasPoints ? (
          <p className="text-sm text-neutral-500">
            No data available for this configuration. Try a different metric or set.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ScatterChart width={chartWidth} height={400}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Variable" />
              <YAxis dataKey="y" name="Metric" />
              <Tooltip />

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
