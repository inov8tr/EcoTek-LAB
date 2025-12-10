type Numeric = number | null | undefined;

export type BinderInput = {
  storageStabilityDifference?: Numeric;
  recoveryPct?: Numeric;
  softeningPoint?: Numeric;
  viscosity135?: Numeric;
  viscosity165?: Numeric;
  pgHigh?: Numeric;
  pgLow?: Numeric;
  crmPct?: Numeric;
  reagentPct?: Numeric;
  aerosilPct?: Numeric;
};

export type BinderRuleResult = {
  overall: "pass" | "warn" | "fail";
  rating: "A" | "B" | "C" | "D";
  pgGrade: string;
  flags: string[];
};

function isNumber(v: Numeric): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function pushFlag(flags: string[], condition: boolean, flag: string) {
  if (condition) flags.push(flag);
}

export function evaluateBinderRules(input: BinderInput): BinderRuleResult {
  const flags: string[] = [];

  // Baseline thresholds (can be tuned in Admin Rules Console later)
  const stabilityLimit = 5;
  const recoveryMin = 70;
  const softeningMin = 60;
  const viscosity135Max = 3000; // cP
  const viscosity165Max = 800; // cP

  // Storage stability
  if (isNumber(input.storageStabilityDifference)) {
    pushFlag(flags, input.storageStabilityDifference > stabilityLimit, "stability-over-limit");
    pushFlag(flags, input.storageStabilityDifference > stabilityLimit * 1.5, "stability-critical");
  }

  // Recovery
  if (isNumber(input.recoveryPct)) {
    pushFlag(flags, input.recoveryPct < recoveryMin, "recovery-low");
    pushFlag(flags, input.recoveryPct < recoveryMin - 10, "recovery-critical");
  }

  // Softening point
  if (isNumber(input.softeningPoint)) {
    pushFlag(flags, input.softeningPoint < softeningMin, "softening-low");
  }

  // Viscosity checks
  if (isNumber(input.viscosity135)) {
    pushFlag(flags, input.viscosity135 > viscosity135Max, "viscosity135-high");
  }
  if (isNumber(input.viscosity165)) {
    pushFlag(flags, input.viscosity165 > viscosity165Max, "viscosity165-high");
  }

  // PG grade mapping
  const pgHigh = isNumber(input.pgHigh) ? input.pgHigh : null;
  const pgLow = isNumber(input.pgLow) ? input.pgLow : null;
  const pgGrade =
    pgHigh !== null && pgLow !== null ? `PG ${Math.round(pgHigh)}-${Math.abs(Math.round(pgLow))}` : "PG —";

  // Reagent sanity
  if (isNumber(input.reagentPct) && input.reagentPct > 4) {
    pushFlag(flags, true, "reagent-high");
  }
  if (isNumber(input.crmPct) && input.crmPct > 4) {
    pushFlag(flags, true, "crm-high");
  }
  if (isNumber(input.aerosilPct) && input.aerosilPct > 2) {
    pushFlag(flags, true, "aerosil-high");
  }

  // Aggregate severity
  const critical = flags.some((f) => f.includes("critical"));
  const warnings = flags.length > 0;
  const overall: BinderRuleResult["overall"] = critical ? "fail" : warnings ? "warn" : "pass";

  // Rating heuristic
  let rating: BinderRuleResult["rating"] = "A";
  if (overall === "fail") rating = "D";
  else if (overall === "warn") rating = "B";

  return {
    overall,
    rating,
    pgGrade,
    flags,
  };
}
