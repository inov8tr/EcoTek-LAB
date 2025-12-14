from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from db import fetch_all, fetch_one

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


# ----------------------------- Schema/version -----------------------------
SCHEMA_VERSION = 1


@app.get("/health/schema")
def schema_version():
    return {"version": SCHEMA_VERSION}


# ----------------------------- DB intent models -----------------------------
class UserSummary(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str
    status: str
    createdAt: datetime


class CapsuleMaterial(BaseModel):
    id: str
    materialName: str
    percentage: float


class PmaFormulaSummary(BaseModel):
    id: str
    name: str
    createdAt: datetime


class CapsuleFormulaResponse(BaseModel):
    id: str
    slug: str
    code: str
    name: str
    description: Optional[str]
    materials: List[CapsuleMaterial]
    pmaCount: int
    createdAt: datetime
    updatedAt: datetime


class CapsuleFormulaDetail(CapsuleFormulaResponse):
    pmaFormulas: List[PmaFormulaSummary]


class BinderTestResponse(BaseModel):
    id: str
    name: Optional[str]
    testName: str
    status: str
    pgHigh: Optional[int]
    pgLow: Optional[int]
    batchId: Optional[str]
    binderSource: Optional[str]
    crmPct: Optional[float]
    reagentPct: Optional[float]
    aerosilPct: Optional[float]
    createdAt: datetime
    updatedAt: datetime


class LinkedTestResult(BaseModel):
    storageStabilityRecoveryPercent: Optional[float]
    storageStabilityGstarPercent: Optional[float]
    storageStabilityJnrPercent: Optional[float]
    deltaSoftening: Optional[float]
    softeningPoint: Optional[float]
    viscosity135: Optional[float]
    ductility15: Optional[float]
    ductility25: Optional[float]
    recovery: Optional[float]
    pgHigh: Optional[int]
    pgLow: Optional[int]


class BinderTestDetail(BinderTestResponse):
    aiExtractedData: Optional[dict]
    dsrData: Optional[dict]
    lab: Optional[str]
    operator: Optional[str]
    jnr_3_2: Optional[float]
    recoveryPct: Optional[float]
    softeningPointC: Optional[float]
    viscosity155_cP: Optional[float]
    ductilityCm: Optional[float]
    labName: Optional[str]
    notes: Optional[str]
    bitumenTestId: Optional[str]
    bitumenOriginId: Optional[str]
    linkedTestResult: Optional[LinkedTestResult]


class PmaFormulaResponse(BaseModel):
    id: str
    name: str
    capsuleFormulaId: str
    bitumenOriginId: str
    bitumenTestId: Optional[str]
    ecoCapPercentage: float
    reagentPercentage: float
    pmaTargetPgHigh: Optional[int]
    pmaTargetPgLow: Optional[int]
    bitumenGradeOverride: Optional[str]
    notes: Optional[str]
    capsuleFormula: Optional[dict]
    bitumenOrigin: Optional[dict]
    bitumenTest: Optional[dict]
    batchCount: int
    createdAt: datetime
    updatedAt: datetime


# ----------------------------- DB intent endpoints (read-only) -----------------------------
@app.get("/db/users", response_model=List[UserSummary])
def list_users():
    rows = fetch_all(
        """
        SELECT "id", "email", "name", "role", "status", "createdAt"
        FROM "User"
        ORDER BY "createdAt" DESC
        """
    )
    return rows


@app.get("/db/users/{user_id}", response_model=UserSummary)
def get_user(user_id: str):
    row = fetch_one(
        """
        SELECT "id", "email", "name", "role", "status", "createdAt"
        FROM "User"
        WHERE "id" = %s
        """,
        (user_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@app.get("/db/capsules", response_model=List[CapsuleFormulaResponse])
def list_capsules():
    rows = fetch_all(
        """
        SELECT
          cf."id",
          cf."slug",
          cf."code",
          cf."name",
          cf."description",
          cf."createdAt",
          cf."updatedAt",
          COALESCE(
            (
              SELECT json_agg(json_build_object(
                'id', m."id",
                'materialName', m."materialName",
                'percentage', m."percentage"
              ) ORDER BY m."createdAt")
              FROM "CapsuleFormulaMaterial" m
              WHERE m."capsuleFormulaId" = cf."id"
            ),
            '[]'
          ) AS "materials",
          (SELECT COUNT(*) FROM "PmaFormula" p WHERE p."capsuleFormulaId" = cf."id") AS "pmaCount"
        FROM "CapsuleFormula" cf
        ORDER BY cf."createdAt" DESC
        """
    )
    return rows


@app.get("/db/capsules/{capsule_id}", response_model=CapsuleFormulaDetail)
def get_capsule(capsule_id: str):
    row = fetch_one(
        """
        SELECT
          cf."id",
          cf."slug",
          cf."code",
          cf."name",
          cf."description",
          cf."createdAt",
          cf."updatedAt",
          COALESCE(
            (
              SELECT json_agg(json_build_object(
                'id', m."id",
                'materialName', m."materialName",
                'percentage', m."percentage"
              ) ORDER BY m."createdAt")
              FROM "CapsuleFormulaMaterial" m
              WHERE m."capsuleFormulaId" = cf."id"
            ),
            '[]'
          ) AS "materials",
          COALESCE(
            (
              SELECT json_agg(json_build_object(
                'id', p."id",
                'name', p."name",
                'bitumenGradeOverride', p."bitumenGradeOverride",
                'bitumenOrigin', CASE
                  WHEN bo."id" IS NOT NULL THEN json_build_object(
                    'id', bo."id",
                    'refineryName', bo."refineryName",
                    'binderGrade', bo."binderGrade"
                  )
                  ELSE NULL
                END,
                'bitumenTest', CASE
                  WHEN bt."id" IS NOT NULL THEN json_build_object(
                    'id', bt."id",
                    'batchCode', bt."batchCode"
                  )
                  ELSE NULL
                END,
                'createdAt', p."createdAt"
              ) ORDER BY p."createdAt")
              FROM "PmaFormula" p
              LEFT JOIN "BitumenOrigin" bo ON bo."id" = p."bitumenOriginId"
              LEFT JOIN "BitumenBaseTest" bt ON bt."id" = p."bitumenTestId"
              WHERE p."capsuleFormulaId" = cf."id"
            ),
            '[]'
          ) AS "pmaFormulas",
          (SELECT COUNT(*) FROM "PmaFormula" p WHERE p."capsuleFormulaId" = cf."id") AS "pmaCount"
        FROM "CapsuleFormula" cf
        WHERE cf."id" = %s
        """,
        (capsule_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Capsule not found")
    return row


@app.get("/db/binder-tests", response_model=List[BinderTestResponse])
def list_binder_tests(q: Optional[str] = None, status: Optional[str] = None):
    clauses: list[str] = []
    params: list[object] = []

    if q:
        clauses.append('("name" ILIKE %s OR "testName" ILIKE %s)')
        like = f"%{q}%"
        params.extend([like, like])

    # If status filter provided, use it; otherwise exclude archived by default
    allowed_status = {"PENDING_REVIEW", "READY", "ARCHIVED"}
    if status and status in allowed_status:
        clauses.append('"status" = %s')
        params.append(status)
    else:
        clauses.append('"status" <> %s')
        params.append("ARCHIVED")

    where_sql = ""
    if clauses:
        where_sql = "WHERE " + " AND ".join(clauses)

    rows = fetch_all(
        f"""
        SELECT
          "id",
          "name",
          "testName",
          "status",
          "pgHigh",
          "pgLow",
          "batchId",
          "binderSource",
          "crmPct",
          "reagentPct",
          "aerosilPct",
          "createdAt",
          "updatedAt"
        FROM "BinderTest"
        {where_sql}
        ORDER BY "createdAt" DESC
        """,
        params,
    )
    return rows


@app.get("/db/binder-tests/{test_id}", response_model=BinderTestDetail)
def get_binder_test(test_id: str):
    row = fetch_one(
        """
        SELECT
          bt."id",
          bt."name",
          bt."testName",
          bt."status",
          bt."pgHigh",
          bt."pgLow",
          bt."batchId",
          bt."binderSource",
          bt."crmPct",
          bt."reagentPct",
          bt."aerosilPct",
          bt."aiExtractedData",
          bt."dsrData",
          bt."lab",
          bt."operator",
          bt."jnr_3_2",
          bt."recoveryPct",
          bt."softeningPointC",
          bt."viscosity155_cP",
          bt."ductilityCm",
          bt."lab" AS "labName",
          bt."notes",
          bt."bitumenTestId",
          bt."bitumenOriginId",
          (
            SELECT json_build_object(
              'storageStabilityRecoveryPercent', tr."storageStabilityRecoveryPercent",
              'storageStabilityGstarPercent', tr."storageStabilityGstarPercent",
              'storageStabilityJnrPercent', tr."storageStabilityJnrPercent",
              'deltaSoftening', tr."deltaSoftening",
              'softeningPoint', tr."softeningPoint",
              'viscosity135', tr."viscosity135",
              'ductility15', tr."ductility15",
              'ductility25', tr."ductility25",
              'recovery', tr."recovery",
              'pgHigh', tr."pgHigh",
              'pgLow', tr."pgLow"
            )
            FROM "TestResult" tr
            WHERE tr."batchId"::text = bt."batchId"
            ORDER BY tr."createdAt" DESC
            LIMIT 1
          ) AS "linkedTestResult",
          bt."createdAt",
          bt."updatedAt"
        FROM "BinderTest" bt
        WHERE bt."id" = %s
        """,
        (test_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Binder test not found")
    return row


# ----------------------------- Analytics intents -----------------------------
class StorageStabilityPoint(BaseModel):
    label: str
    value: Optional[float]


class RecoveryVsReagentPoint(BaseModel):
    reagent: Optional[float]
    recovery: Optional[float]


class EcoCapSofteningPoint(BaseModel):
    ecoCap: Optional[float]
    softeningPoint: Optional[float]


class PgImprovementPoint(BaseModel):
    originId: Optional[str]
    formulaId: str
    deltaHigh: float
    deltaLow: float


class AnalyticsOverview(BaseModel):
    storageStabilityTrend: List[StorageStabilityPoint]
    recoveryVsReagent: List[RecoveryVsReagentPoint]
    ecoCapVsSofteningPoint: List[EcoCapSofteningPoint]
    pgImprovement: List[PgImprovementPoint]


class AnalysisSet(BaseModel):
    id: str
    name: str
    description: Optional[str]
    ownerId: Optional[str]
    createdAt: datetime


@app.get("/analytics/binder", response_model=List[AnalysisSet])
def binder_analytics(owner_id: Optional[str] = None, is_admin: bool = False):
    clauses: list[str] = []
    params: list[object] = []
    if not is_admin:
        clauses.append('( "ownerId" = %s OR "ownerId" IS NULL )')
        params.append(owner_id)

    where_sql = ""
    if clauses:
        where_sql = "WHERE " + " AND ".join(clauses)

    rows = fetch_all(
        f"""
        SELECT
          "id",
          "name",
          "description",
          "ownerId",
          "createdAt"
        FROM "AnalysisSet"
        {where_sql}
        ORDER BY "createdAt" DESC
        """,
        params,
    )
    return rows


@app.get("/analytics/overview", response_model=AnalyticsOverview)
def analytics_overview():
    stability_rows = fetch_all(
        """
        SELECT
          pb."batchCode" AS label,
          tr."storageStabilityDifference" AS value
        FROM "PmaBatch" pb
        LEFT JOIN LATERAL (
          SELECT "storageStabilityDifference"
          FROM "PmaTestResult" tr
          WHERE tr."pmaBatchId" = pb."id"
          ORDER BY tr."createdAt" DESC
          LIMIT 1
        ) tr ON TRUE
        ORDER BY pb."createdAt" ASC
        """
    )

    stability = [
        {"label": row["label"], "value": float(row["value"])}
        for row in stability_rows
        if row.get("value") is not None
    ]

    recovery_rows = fetch_all(
        """
        SELECT
          pf."reagentPercentage" AS reagent,
          tr."elasticRecovery" AS recovery
        FROM "PmaFormula" pf
        JOIN "PmaBatch" pb ON pb."pmaFormulaId" = pf."id"
        LEFT JOIN LATERAL (
          SELECT "elasticRecovery"
          FROM "PmaTestResult" tr
          WHERE tr."pmaBatchId" = pb."id"
          ORDER BY tr."createdAt" DESC
          LIMIT 1
        ) tr ON TRUE
        WHERE tr."elasticRecovery" IS NOT NULL
        """
    )

    recovery = [
        {"reagent": float(row["reagent"]), "recovery": float(row["recovery"])}
        for row in recovery_rows
        if row.get("reagent") is not None and row.get("recovery") is not None
    ]

    eco_cap_rows = fetch_all(
        """
        SELECT
          pf."ecoCapPercentage" AS "ecoCap",
          tr."softeningPoint" AS "softeningPoint"
        FROM "PmaFormula" pf
        JOIN "PmaBatch" pb ON pb."pmaFormulaId" = pf."id"
        LEFT JOIN LATERAL (
          SELECT "softeningPoint"
          FROM "PmaTestResult" tr
          WHERE tr."pmaBatchId" = pb."id"
          ORDER BY tr."createdAt" DESC
          LIMIT 1
        ) tr ON TRUE
        WHERE tr."softeningPoint" IS NOT NULL
        """
    )

    eco_cap = [
        {"ecoCap": float(row["ecoCap"]), "softeningPoint": float(row["softeningPoint"])}
        for row in eco_cap_rows
        if row.get("ecoCap") is not None and row.get("softeningPoint") is not None
    ]

    pg_rows = fetch_all(
        """
        SELECT
          pf."bitumenOriginId" AS "originId",
          pf."id" AS "formulaId",
          COALESCE(latest."pgHigh", bt."basePgHigh", 0) AS "pgHigh",
          COALESCE(latest."pgLow", bt."basePgLow", 0) AS "pgLow",
          COALESCE(bt."basePgHigh", 0) AS "basePgHigh",
          COALESCE(bt."basePgLow", 0) AS "basePgLow"
        FROM "PmaFormula" pf
        LEFT JOIN "BitumenBaseTest" bt ON bt."id" = pf."bitumenTestId"
        LEFT JOIN LATERAL (
          SELECT tr."pgHigh", tr."pgLow"
          FROM "PmaBatch" pb
          JOIN "PmaTestResult" tr ON tr."pmaBatchId" = pb."id"
          WHERE pb."pmaFormulaId" = pf."id"
          ORDER BY tr."createdAt" DESC
          LIMIT 1
        ) latest ON TRUE
        """
    )

    pg_improvement = [
        {
            "originId": row.get("originId"),
            "formulaId": row["formulaId"],
            "deltaHigh": (row.get("pgHigh") or 0) - (row.get("basePgHigh") or 0),
            "deltaLow": (row.get("pgLow") or 0) - (row.get("basePgLow") or 0),
        }
        for row in pg_rows
    ]

    return {
        "storageStabilityTrend": stability,
        "recoveryVsReagent": recovery,
        "ecoCapVsSofteningPoint": eco_cap,
        "pgImprovement": pg_improvement,
    }


# ----------------------------- Capsule writes -----------------------------
class CapsuleMaterialInput(BaseModel):
    materialName: str
    percentage: float


class CapsuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    createdById: Optional[str] = None
    materials: List[CapsuleMaterialInput]


class CapsuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    materials: Optional[List[CapsuleMaterialInput]] = None


@app.post("/db/capsules")
def create_capsule(payload: CapsuleCreate):
    if not payload.materials:
        raise HTTPException(status_code=400, detail="At least one material is required")
    total = sum(m.percentage for m in payload.materials)
    if abs(round(total, 3) - 100) > 0.001:
        raise HTTPException(status_code=400, detail=f"Material percentages must total 100%. Currently {total}%")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "CapsuleFormula" ("name", "description", "createdById")
            VALUES (%s, %s, %s)
            RETURNING "id", "name", "description", "createdById", "createdAt", "updatedAt"
            """,
            (payload.name, payload.description, payload.createdById),
        )
        capsule = cur.fetchone()
        materials: list[dict] = []
        for m in payload.materials:
            cur.execute(
                """
                INSERT INTO "CapsuleFormulaMaterial" ("capsuleFormulaId", "materialName", "percentage")
                VALUES (%s, %s, %s)
                RETURNING "id", "materialName", "percentage", "createdAt", "updatedAt"
                """,
                (capsule["id"], m.materialName, m.percentage),
            )
            materials.append(cur.fetchone())
        conn.commit()

    return {
        **capsule,
        "materials": materials,
        "pmaCount": 0,
    }


@app.patch("/db/capsules/{capsule_id}")
def update_capsule(capsule_id: str, payload: CapsuleUpdate):
    if payload.materials is not None:
        if len(payload.materials) < 1:
            raise HTTPException(status_code=400, detail="At least one material is required")
        total = sum(m.percentage for m in payload.materials)
        if abs(round(total, 3) - 100) > 0.001:
            raise HTTPException(status_code=400, detail=f"Material percentages must total 100%. Currently {total}%")

    if payload.name is None and payload.description is None and payload.materials is None:
        raise HTTPException(status_code=400, detail="No changes provided")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute('SELECT 1 FROM "CapsuleFormula" WHERE "id" = %s', (capsule_id,))
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Capsule not found")

        if payload.name is not None or payload.description is not None:
            cur.execute(
                """
                UPDATE "CapsuleFormula"
                SET "name" = COALESCE(%s, "name"),
                    "description" = %s
                WHERE "id" = %s
                """,
                (payload.name, payload.description, capsule_id),
            )

        if payload.materials is not None:
            cur.execute('DELETE FROM "CapsuleFormulaMaterial" WHERE "capsuleFormulaId" = %s', (capsule_id,))
            for m in payload.materials:
                cur.execute(
                    """
                    INSERT INTO "CapsuleFormulaMaterial" ("capsuleFormulaId", "materialName", "percentage")
                    VALUES (%s, %s, %s)
                    """,
                    (capsule_id, m.materialName, m.percentage),
                )

        conn.commit()

        cur.execute(
            """
            SELECT
              cf."id",
              cf."slug",
              cf."code",
              cf."name",
              cf."description",
              cf."createdAt",
              cf."updatedAt",
              COALESCE(
                (
                  SELECT json_agg(json_build_object(
                    'id', m."id",
                    'materialName', m."materialName",
                    'percentage', m."percentage"
                  ) ORDER BY m."createdAt")
                  FROM "CapsuleFormulaMaterial" m
                  WHERE m."capsuleFormulaId" = cf."id"
                ),
                '[]'
              ) AS "materials",
              (SELECT COUNT(*) FROM "PmaFormula" p WHERE p."capsuleFormulaId" = cf."id") AS "pmaCount"
            FROM "CapsuleFormula" cf
            WHERE cf."id" = %s
            """,
            (capsule_id,),
        )
        updated = cur.fetchone()

    return updated


@app.get("/db/pma-formulas", response_model=List[PmaFormulaResponse])
def list_pma_formulas():
    rows = fetch_all(
        """
        SELECT
          "id",
          "name",
          "capsuleFormulaId",
          "bitumenOriginId",
          "bitumenTestId",
          "ecoCapPercentage",
          "reagentPercentage",
          "pmaTargetPgHigh",
          "pmaTargetPgLow",
          "bitumenGradeOverride",
          "notes",
          (
            SELECT json_build_object(
              'id', cf."id",
              'name', cf."name"
            ) FROM "CapsuleFormula" cf WHERE cf."id" = pf."capsuleFormulaId"
          ) AS "capsuleFormula",
          (
            SELECT json_build_object(
              'id', bo."id",
              'refineryName', bo."refineryName",
              'binderGrade', bo."binderGrade"
            ) FROM "BitumenOrigin" bo WHERE bo."id" = pf."bitumenOriginId"
          ) AS "bitumenOrigin",
          (
            SELECT json_build_object(
              'id', bt."id",
              'batchCode', bt."batchCode"
            ) FROM "BitumenBaseTest" bt WHERE bt."id" = pf."bitumenTestId"
          ) AS "bitumenTest",
          (SELECT COUNT(*) FROM "PmaBatch" pb WHERE pb."pmaFormulaId" = pf."id") AS "batchCount",
          "createdAt",
          "updatedAt"
        FROM "PmaFormula" pf
        ORDER BY pf."createdAt" DESC
        """
    )
    return rows


@app.get("/db/pma-formulas/{formula_id}", response_model=PmaFormulaResponse)
def get_pma_formula(formula_id: str):
    row = fetch_one(
        """
        SELECT
          "id",
          "name",
          "capsuleFormulaId",
          "bitumenOriginId",
          "bitumenTestId",
          "ecoCapPercentage",
          "reagentPercentage",
          "pmaTargetPgHigh",
          "pmaTargetPgLow",
          "createdAt",
          "updatedAt"
        FROM "PmaFormula"
        WHERE "id" = %s
        """,
        (formula_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="PMA formula not found")
    return row


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
