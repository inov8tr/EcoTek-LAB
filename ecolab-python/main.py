from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.pg import compute_pg_grade
from services.dsr import compute_dsr_curve
from services.softening_point import estimate_softening_point
from services.viscosity import estimate_viscosity
from services.trendline import compute_trendline
from ml.predict_storage_stability import predict_storage_stability


app = FastAPI(title="EcoLAB Scientific Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


class PGRequest(BaseModel):
    temps: list[float] = Field(..., description="Array of high temp candidates")
    gstar_original: list[float] = Field(..., description="G* values before RTFO")
    gstar_rtfo: list[float] = Field(..., description="G* values after RTFO")


class PGResponse(BaseModel):
    pg_high: float
    inputs: PGRequest


class DSRRequest(BaseModel):
    temps: list[float]
    gstar: list[float]


class DSRResponse(BaseModel):
    curve: list[tuple[float, float]]


class TrendlineRequest(BaseModel):
    x: list[float]
    y: list[float]


class TrendlineResponse(BaseModel):
    slope: float
    intercept: float
    r_squared: float


@app.post("/compute/pg", response_model=PGResponse)
def compute_pg_endpoint(payload: PGRequest):
    pg_high = compute_pg_grade(payload.temps, payload.gstar_original, payload.gstar_rtfo)
    return PGResponse(pg_high=pg_high, inputs=payload)


@app.post("/compute/dsr", response_model=DSRResponse)
def compute_dsr_endpoint(payload: DSRRequest):
    curve = compute_dsr_curve(payload.temps, payload.gstar)
    return DSRResponse(curve=curve)


@app.post("/compute/trendline", response_model=TrendlineResponse)
def compute_trendline_endpoint(payload: TrendlineRequest):
    slope, intercept, r2 = compute_trendline(payload.x, payload.y)
    return TrendlineResponse(slope=slope, intercept=intercept, r_squared=r2)


@app.get("/estimate/softening-point")
def estimate_softening_point_endpoint(temp1: float, temp2: float, penetration_ratio: float):
    value = estimate_softening_point(temp1, temp2, penetration_ratio)
    return {"softening_point": value}


@app.get("/estimate/viscosity")
def estimate_viscosity_endpoint(temp: float, shear_rate: float):
    return {"viscosity": estimate_viscosity(temp, shear_rate)}


@app.get("/predict/storage-stability")
def predict_storage_stability_endpoint(g_star: float, phase_angle: float, density: float):
    prediction = predict_storage_stability(g_star, phase_angle, density)
    return {"prediction": prediction}


@app.get("/health")
def health_check():
    return {"status": "ok"}
