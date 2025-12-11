export function computeViscosity(values: {
  temp: number;
  g_star: number;
}) {
  // Placeholder
  return {
    viscosity: values.g_star / (values.temp + 1),
  };
}
