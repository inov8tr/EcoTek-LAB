export function computeStorageStability(values: {
  capsulePct: number;
  aerosilPct: number;
  viscosity: number;
}) {
  // Placeholder logic
  return {
    stabilityIndex: values.viscosity * 0.02,
    ok: true,
  };
}
