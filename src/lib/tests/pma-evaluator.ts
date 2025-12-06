export type PmaEvaluationInput = {
  storabilityPct?: number | null;
  solubilityPct?: number | null;
  jnr?: number | null;
  elasticRecoveryPct?: number | null;
  softeningPointC?: number | null;
  ductilityCm?: number | null;
  viscosityPaS?: number | null;
  pgHigh?: number | null;
  pgLow?: number | null;
};

export type PmaThresholds = {
  maxStorabilityPct: number;
  minSolubilityPct: number;
  maxJnr: number;
  minElasticRecoveryPct: number;
  minSofteningPointC: number;
  minDuctilityCm: number;
  maxViscosityPaS: number;
  minPgHigh: number;
  maxPgLow: number;
};

export type PmaEvaluationResult = {
  outcome: "PASS" | "FAIL" | "PARTIAL";
  failedReasons: string[];
};

export const DEFAULT_KOREA_PMA_PG82_22: PmaThresholds = {
  maxStorabilityPct: 5,
  minSolubilityPct: 95,
  maxJnr: 0.5,
  minElasticRecoveryPct: 55,
  minSofteningPointC: 80,
  minDuctilityCm: 50,
  maxViscosityPaS: 300,
  minPgHigh: 82,
  maxPgLow: -22,
};

export function evaluatePma(
  input: PmaEvaluationInput,
  thresholds: PmaThresholds = DEFAULT_KOREA_PMA_PG82_22,
): PmaEvaluationResult {
  const failed: string[] = [];

  if (isNumber(input.storabilityPct) && input.storabilityPct > thresholds.maxStorabilityPct) {
    failed.push(`Storability ${input.storabilityPct}% > ${thresholds.maxStorabilityPct}%`);
  }
  if (isNumber(input.solubilityPct) && input.solubilityPct < thresholds.minSolubilityPct) {
    failed.push(`Solubility ${input.solubilityPct}% < ${thresholds.minSolubilityPct}%`);
  }
  if (isNumber(input.jnr) && input.jnr > thresholds.maxJnr) {
    failed.push(`Jnr ${input.jnr} > ${thresholds.maxJnr}`);
  }
  if (
    isNumber(input.elasticRecoveryPct) &&
    input.elasticRecoveryPct < thresholds.minElasticRecoveryPct
  ) {
    failed.push(
      `Elastic Recovery ${input.elasticRecoveryPct}% < ${thresholds.minElasticRecoveryPct}%`,
    );
  }
  if (isNumber(input.softeningPointC) && input.softeningPointC < thresholds.minSofteningPointC) {
    failed.push(
      `Softening Point ${input.softeningPointC}°C < ${thresholds.minSofteningPointC}°C`,
    );
  }
  if (isNumber(input.ductilityCm) && input.ductilityCm < thresholds.minDuctilityCm) {
    failed.push(`Ductility ${input.ductilityCm} cm < ${thresholds.minDuctilityCm} cm`);
  }
  if (isNumber(input.viscosityPaS) && input.viscosityPaS > thresholds.maxViscosityPaS) {
    failed.push(`Viscosity ${input.viscosityPaS} Pa·s > ${thresholds.maxViscosityPaS} Pa·s`);
  }
  if (isNumber(input.pgHigh) && input.pgHigh < thresholds.minPgHigh) {
    failed.push(`PG High ${input.pgHigh} < ${thresholds.minPgHigh}`);
  }
  if (isNumber(input.pgLow) && input.pgLow > thresholds.maxPgLow) {
    failed.push(`PG Low ${input.pgLow} > ${thresholds.maxPgLow}`);
  }

  if (failed.length === 0) {
    return { outcome: "PASS", failedReasons: [] };
  }

  return {
    outcome: "PARTIAL",
    failedReasons: failed,
  };
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
