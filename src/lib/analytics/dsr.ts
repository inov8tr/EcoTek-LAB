export function computeDsr(values: {
  g: number;
  delta: number;
  temp: number;
}) {
  return {
    stiffness: values.g * Math.cos(values.delta),
  };
}
