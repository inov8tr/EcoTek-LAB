"use client";

import { useState } from "react";
import StorageStabilityAnalytics from "./StorageStabilityAnalytics";
import BinderMetricsAnalytics from "./BinderMetricsAnalytics";
import MaterialOptimizationAnalytics from "./MaterialOptimizationAnalytics";

type AnalyticsTabsProps = {
  initialSets: any[];
  initialTestSetId?: string | null;
};

export default function AnalyticsTabs({ initialSets = [], initialTestSetId }: AnalyticsTabsProps) {
  const [tab, setTab] = useState<"storage" | "metrics" | "optimization">("storage");
  const [testSets] = useState(initialSets);
  const defaultSetId = initialTestSetId ?? testSets[0]?.id ?? null;

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="inline-flex rounded-xl border bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab("storage")}
          className={`rounded-lg px-4 py-2 text-sm ${
            tab === "storage" ? "bg-brand-primary text-white" : "text-neutral-700"
          }`}
        >
          Storage Stability
        </button>
        <button
          onClick={() => setTab("metrics")}
          className={`rounded-lg px-4 py-2 text-sm ${
            tab === "metrics" ? "bg-brand-primary text-white" : "text-neutral-700"
          }`}
        >
          Binder Metrics
        </button>
        <button
          onClick={() => setTab("optimization")}
          className={`rounded-lg px-4 py-2 text-sm ${
            tab === "optimization" ? "bg-brand-primary text-white" : "text-neutral-700"
          }`}
        >
          Material Optimization
        </button>
      </div>

      {/* Views */}
      {tab === "storage" && (
        <StorageStabilityAnalytics initialTestSets={testSets} initialTestSetId={defaultSetId} />
      )}
      {tab === "metrics" && (
        <BinderMetricsAnalytics initialTestSets={testSets} initialTestSetId={defaultSetId} />
      )}
      {tab === "optimization" && (
        <MaterialOptimizationAnalytics initialTestSets={testSets} initialTestSetId={defaultSetId} />
      )}
    </div>
  );
}
