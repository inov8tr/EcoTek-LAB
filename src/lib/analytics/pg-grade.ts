export type PgGradeInput = {
  g_original: number;
  delta_original: number;
  g_rtfo: number;
  delta_rtfo: number;
};

export type PgGradeOutput = {
  pg_high: number;
  pg_low: number;
  ok: boolean;
};

export function computePgGrade(_input: PgGradeInput): PgGradeOutput {
  // TEMPORARY placeholder logic; replace with AASHTO M320 equations.
  return {
    pg_high: 64,
    pg_low: -22,
    ok: true,
  };
}
