import { computePgGrade as tsPgGrade } from "./pg-grade";
import { pythonClient } from "./python-client";
import type { PgGradeInput } from "./pg-grade";

const USE_PYTHON = !!process.env.PYTHON_SERVICE_URL;

export const Analytics = {
  computePgGrade(input: PgGradeInput) {
    if (USE_PYTHON) {
      return pythonClient("pg-grade", input);
    }
    return tsPgGrade(input);
  },
};
