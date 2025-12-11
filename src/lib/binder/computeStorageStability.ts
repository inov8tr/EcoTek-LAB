export function computeRecoveryStability(values: number[]) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return ((max - min) / max) * 100;
}

export function computeGstarStability(values: number[]) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return ((max - min) / max) * 100;
}

export function computeJnrStability(values: number[]) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return ((max - min) / max) * 100;
}

export function computeDeltaSoftening(top: number | null, bottom: number | null) {
  if (top == null || bottom == null) return null;
  return Number((top - bottom).toFixed(2));
}

export function computeStorageStability(result: any) {
  return {
    recovery: computeRecoveryStability(result.recoveryValues ?? []),
    gstar: computeGstarStability(result.gstarValues ?? []),
    jnr: computeJnrStability(result.jnrValues ?? []),
    delta: computeDeltaSoftening(result.softeningTop, result.softeningBottom),
  };
}
