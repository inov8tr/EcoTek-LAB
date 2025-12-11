// src/types/analytics.ts

// High-level metric types for analytics UI state
export type StorageStabilityMethod = "RECOVERY" | "GSTAR" | "JNR" | "DELTA_SOFTENING";

export type BinderMetricType =
  | "SOFTENING_POINT"
  | "DUCTILITY_15"
  | "DUCTILITY_25"
  | "VISCOSITY_135"
  | "ELASTIC_RECOVERY"
  | "JNR"
  | "SOLUBILITY"
  | "PG_HIGH"
  | "PG_LOW";

// Variable keys map to underlying numeric fields from capsule, PMA, bitumen, etc.
export type VariableKey =
  | "capsule.sbsPercent"
  | "capsule.oilPercent"
  | "capsule.sulfurPercent"
  | "capsule.fillerPercent"
  | "pma.capsuleDosagePercent"
  | "pma.mixingTemperature"
  | "bitumenOrigin.penetration"
  | "bitumenOrigin.softeningPoint"
  | string; // allow extension

// Point shape for chart data
export interface AnalyticsPoint {
  x: number;
  y: number;
  label?: string; // e.g., batch code or test ID
  testResultId?: string;
}

// Specialized point for storage stability charts
export interface StorageStabilityPoint extends AnalyticsPoint {
  method: StorageStabilityMethod;
}

// Configuration for a saved analysis session (mirrors Prisma AnalysisSession)
export interface AnalysisSessionConfig {
  metricType: string;
  variableKey: string;
  chartType: "scatter" | "line" | "bar";
  storageStabilityMethod?: StorageStabilityMethod;
  threshold?: number; // e.g., 5% stability limit, 80°C softening, etc.
  filters?: Record<string, unknown>;
  showTrendline?: boolean;
}
