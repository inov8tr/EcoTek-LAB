const MAX_STORABILITY_PERCENT = 5;
const MIN_SOLUBILITY_PERCENT = 95;
const MIN_ELASTIC_RECOVERY_GENERAL = 55;
const MIN_ELASTIC_RECOVERY_HIGH_PG = 80;
const MIN_SOFTENING_POINT = 80;
const MIN_DUCTILITY_15C = 50;
const MAX_VISCOSITY_135_CP = 3000; // Pending confirmation (spec sheet says 300 Pa·s; assumed 3 Pa·s / 3000 cP)

export function computeStorabilityFromGStar(gStarMax?: number | null, gStarAvg?: number | null) {
  if (!gStarMax || !gStarAvg) return NaN;
  return ((gStarMax - gStarAvg) / gStarAvg) * 100;
}

export function computeStorabilityFromRecovery(rMax?: number | null, rAvg?: number | null) {
  if (!rMax || !rAvg) return NaN;
  return ((rMax - rAvg) / rAvg) * 100;
}

export function isStorabilityPass(storabilityPercent: number) {
  return storabilityPercent <= MAX_STORABILITY_PERCENT;
}

export function isSolubilityPass(solubilityPercent: number) {
  return solubilityPercent >= MIN_SOLUBILITY_PERCENT;
}

export function getJnrLimit(pgHigh?: number | null, pgLow?: number | null) {
  if (pgHigh !== null && pgHigh !== undefined && pgLow !== null && pgLow !== undefined) {
    if (pgHigh >= 82 && pgLow <= -34) return 0.2;
  }
  return 0.5;
}

export function isJnrPass(jnr: number, pgHigh?: number | null, pgLow?: number | null) {
  const limit = getJnrLimit(pgHigh, pgLow);
  return jnr <= limit;
}

export function computeElasticRecoveryPercent(rInitial?: number | null, rMax?: number | null) {
  if (!rInitial || !rMax) return NaN;
  return ((rMax - rInitial) / rInitial) * 100;
}

export function getElasticRecoveryLimit(pgHigh?: number | null, pgLow?: number | null) {
  if (pgHigh !== null && pgHigh !== undefined && pgLow !== null && pgLow !== undefined) {
    if (pgHigh >= 82 && pgLow <= -34) return MIN_ELASTIC_RECOVERY_HIGH_PG;
  }
  return MIN_ELASTIC_RECOVERY_GENERAL;
}

export function isElasticRecoveryPass(recoveryPercent: number, pgHigh?: number | null, pgLow?: number | null) {
  const limit = getElasticRecoveryLimit(pgHigh, pgLow);
  return recoveryPercent >= limit;
}

export function isSofteningPointPass(softeningPoint: number) {
  return softeningPoint >= MIN_SOFTENING_POINT;
}

export function isDuctilityPass(ductility15: number) {
  return ductility15 >= MIN_DUCTILITY_15C;
}

export function isViscosityPass(viscosityCp: number) {
  return viscosityCp <= MAX_VISCOSITY_135_CP;
}

export const binderSpecConstants = {
  MAX_STORABILITY_PERCENT,
  MIN_SOLUBILITY_PERCENT,
  MIN_ELASTIC_RECOVERY_GENERAL,
  MIN_ELASTIC_RECOVERY_HIGH_PG,
  MIN_SOFTENING_POINT,
  MIN_DUCTILITY_15C,
  MAX_VISCOSITY_135_CP,
};
