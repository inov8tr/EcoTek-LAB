import { runPython } from "../python-client";

export async function computePgGrade(values: {
  g_original: number;
  delta_original: number;
  g_rtfo: number;
  delta_rtfo: number;
}) {
  return runPython("pg_grade.py", values);
}
