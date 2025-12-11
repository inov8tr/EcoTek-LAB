from fastapi import FastAPI
from pydantic import BaseModel
from analytics.pg_grade import compute_pg_grade
from analytics.dsr import check_dsr_consistency

app = FastAPI()


class PGInput(BaseModel):
  capsule_pct: float
  reagent_pct: float
  dsr_original: dict
  dsr_rtfo: dict
  dsr_pav: dict


@app.post("/analytics/pg-grade")
def pg_grade(payload: PGInput):
  result = compute_pg_grade(payload)
  return result


@app.post("/analytics/dsr-consistency")
def dsr_consistency(payload: PGInput):
  result = check_dsr_consistency(payload)
  return result


@app.get("/health")
def health():
  return {"status": "ok"}
