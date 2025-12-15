from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional
import hashlib
import re
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from db import fetch_all, fetch_one, get_conn

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


def stable_hash(parts: List[str]) -> str:
    joined = "|".join(parts)
    return hashlib.sha256(joined.encode()).hexdigest()


def log_audit_event(
    cur,
    binder_test_id: str,
    event_type: str,
    *,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    before: Optional[dict] = None,
    after: Optional[dict] = None,
    notes: Optional[str] = None,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
):
    cur.execute(
        """
        INSERT INTO "BinderTestAuditEvent" (
          "id", "binderTestId", "eventType", "entityType", "entityId",
          "performedByUserId", "performedByRole", "performedAt",
          "beforeJson", "afterJson", "notes"
        ) VALUES (
          %s, %s, %s, %s, %s,
          %s, %s, NOW(),
          %s, %s, %s
        )
        """,
        (
            str(uuid4()),
            binder_test_id,
            event_type,
            entity_type,
            entity_id,
            user_id,
            user_role,
            before,
            after,
            notes,
        ),
    )


def decimal_to_float(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    try:
        return float(value)
    except Exception:
        return value


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
    lifecycleStatus: Optional[str]
    pgHigh: Optional[int]
    pgLow: Optional[int]
    batchId: Optional[str]
    binderSource: Optional[str]
    crmPct: Optional[float]
    reagentPct: Optional[float]
    aerosilPct: Optional[float]
    testPurpose: Optional[str]
    materialDescription: Optional[str]
    testStandard: Optional[str]
    keywords: Optional[dict]
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
    lifecycleStatus: Optional[str]
    files: Optional[List[dict]]


class BinderTestMetric(BaseModel):
    id: str
    metricType: str
    metricName: Optional[str]
    position: Optional[str]
    value: Optional[float]
    units: Optional[str]
    temperature: Optional[float]
    frequency: Optional[float]
    sourceFile: Optional[dict]
    sourcePage: Optional[int]
    language: Optional[str]
    confidence: Optional[float]
    isUserConfirmed: bool
    parseRunId: Optional[str]


class BinderTestSummaryListItem(BaseModel):
    version: int
    doiLikeId: str
    status: str
    createdAt: datetime
    createdByUserId: Optional[str]
    createdByRole: Optional[str]
    supersedesSummaryId: Optional[str]


class BinderTestSummaryDetail(BaseModel):
    id: str
    binderTestId: str
    version: int
    doiLikeId: str
    status: str
    createdAt: datetime
    createdByUserId: Optional[str]
    createdByRole: Optional[str]
    derivedFromMetricsHash: str
    summaryJson: dict
    supersedesSummaryId: Optional[str]


class BinderTestPeerComment(BaseModel):
    id: str
    binderTestId: str
    summaryVersion: Optional[int]
    commentType: str
    commentText: str
    createdByUserId: Optional[str]
    createdByRole: Optional[str]
    createdAt: datetime
    resolved: bool
    resolvedByUserId: Optional[str]
    resolvedAt: Optional[datetime]


class BinderTestPeerReviewDecision(BaseModel):
    id: str
    binderTestId: str
    summaryVersion: int
    decision: str
    decisionNotes: Optional[str]
    reviewerUserId: Optional[str]
    reviewerRole: Optional[str]
    createdAt: datetime


class BinderTestAuditEvent(BaseModel):
    id: str
    binderTestId: str
    eventType: str
    entityType: Optional[str]
    entityId: Optional[str]
    performedByUserId: Optional[str]
    performedByRole: Optional[str]
    performedAt: datetime
    beforeJson: Optional[dict]
    afterJson: Optional[dict]
    notes: Optional[str]


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

class PmaFormulaCreate(BaseModel):
    name: str
    capsuleFormulaId: str
    bitumenOriginId: str
    bitumenTestId: Optional[str] = None
    ecoCapPercentage: float
    reagentPercentage: float
    mixRpm: Optional[int] = None
    mixTimeMinutes: Optional[float] = None
    pmaTargetPgHigh: Optional[int] = None
    pmaTargetPgLow: Optional[int] = None
    bitumenGradeOverride: Optional[str] = None
    notes: Optional[str] = None


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
          "lifecycleStatus",
          "pgHigh",
          "pgLow",
          "batchId",
          "binderSource",
          "crmPct",
          "reagentPct",
          "aerosilPct",
          "testPurpose",
          "materialDescription",
          "testStandard",
          "keywords",
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
          bt."lifecycleStatus",
          bt."pgHigh",
          bt."pgLow",
          bt."batchId",
          bt."binderSource",
          bt."crmPct",
          bt."reagentPct",
          bt."aerosilPct",
          bt."testPurpose",
          bt."materialDescription",
          bt."testStandard",
          bt."keywords",
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
    files = fetch_all(
        """
        SELECT
          "id",
          COALESCE("label", "fileUrl") AS "fileName",
          "fileType" AS "mimeType",
          NULL::int AS "size",
          "fileUrl" AS "url",
          "createdAt"
        FROM "BinderTestDataFile"
        WHERE "binderTestId" = %s
        ORDER BY "createdAt" DESC
        """,
        (test_id,),
    )
    row["files"] = files
    return row


# ----------------------------- Binder test VM endpoints -----------------------------
def _load_binder_test_basic(binder_test_id: str):
    binder = fetch_one(
        'SELECT "id", "status", "lifecycleStatus", "testName", "name" FROM "BinderTest" WHERE "id" = %s',
        (binder_test_id,),
    )
    if not binder:
        raise HTTPException(status_code=404, detail="Binder test not found")
    return binder


def _collect_candidate_files(binder_test_id: str):
    files = fetch_all(
        """
        SELECT "id", "fileUrl", "fileType", "label", "createdAt"
        FROM "BinderTestDataFile"
        WHERE "binderTestId" = %s
        ORDER BY "createdAt" ASC
        """,
        (binder_test_id,),
    )
    candidates = []
    for f in files:
        kind = (f.get("fileType") or "").lower()
        if "pdf" in kind or "excel" in kind or "xlsx" in kind or "xls" in kind:
            candidates.append(f)
    return candidates


def _stable_metrics_hash(metrics: List[dict]) -> str:
    parts: list[str] = []
    for m in sorted(metrics, key=lambda row: (row.get("metricType") or "", row.get("position") or "", str(row.get("id") or ""))):
        parts.append(
            "|".join(
                [
                    str(m.get("metricType") or ""),
                    str(m.get("position") or ""),
                    str(m.get("value") or ""),
                    str(m.get("units") or ""),
                    str(m.get("temperature") or ""),
                    str(m.get("sourceFileId") or ""),
                    str(m.get("sourcePage") or ""),
                ]
            )
        )
    return stable_hash(parts) if parts else stable_hash(["empty"])


def _hydrate_source_files(file_ids: list[str]):
    if not file_ids:
        return {}
    rows = fetch_all(
        """
        SELECT "id", COALESCE("label", "fileUrl") AS "filename"
        FROM "BinderTestDataFile"
        WHERE "id" = ANY(%s)
        """,
        (file_ids,),
    )
    return {row["id"]: row.get("filename") for row in rows}


@app.post("/binder-tests/{binder_test_id}/parse")
def parse_binder_test(
    binder_test_id: str,
    x_user_id: Optional[str] = Header(None, convert_underscores=False),
    x_user_role: Optional[str] = Header(None, convert_underscores=False),
):
    binder = _load_binder_test_basic(binder_test_id)
    candidate_files = _collect_candidate_files(binder_test_id)
    if not candidate_files:
        raise HTTPException(status_code=400, detail="No parseable files found (expected PDF or Excel under DATA)")

    file_hash = stable_hash(
        [
            f'{f.get("id")}:{f.get("label") or f.get("fileUrl")}:{f.get("createdAt")}'
            for f in sorted(candidate_files, key=lambda f: f.get("id"))
        ]
    )
    parse_run_id = str(uuid4())
    inserted_count = 0
    parser_version = "binder-parser-v1"

    with get_conn() as conn, conn.cursor() as cur:
        try:
            log_audit_event(
                cur,
                binder_test_id,
                "PARSE_STARTED",
                entity_type="parse_run",
                entity_id=parse_run_id,
                after={"parserVersion": parser_version, "inputFilesHash": file_hash},
                user_id=x_user_id,
                user_role=x_user_role,
            )
            cur.execute(
                """
                INSERT INTO "BinderTestParseRun" (
                  "id", "binderTestId", "inputFileIds", "inputFilesHash",
                  "parserVersion", "startedAt", "status"
                ) VALUES (%s, %s, %s, %s, %s, NOW(), %s)
                """,
                (parse_run_id, binder_test_id, [f["id"] for f in candidate_files], file_hash, parser_version, "STARTED"),
            )

            cur.execute(
                'DELETE FROM "BinderTestMetric" WHERE "binderTestId" = %s AND "isUserConfirmed" = false',
                (binder_test_id,),
            )

            metric_rows: list[dict] = []
            for field in [
                ("pgHigh", binder.get("pgHigh"), None, None),
                ("pgLow", binder.get("pgLow"), None, None),
            ]:
                name, val, units, position = field
                if val is None:
                    continue
                metric_rows.append(
                    {
                        "metricType": name,
                        "metricName": name,
                        "position": position,
                        "value": float(val),
                        "units": units,
                        "temperature": None,
                        "frequency": None,
                        "sourceFileId": candidate_files[0]["id"] if candidate_files else None,
                        "sourcePage": None,
                        "language": None,
                        "confidence": None,
                    }
                )

            if not metric_rows:
                for idx, f in enumerate(candidate_files):
                    metric_rows.append(
                        {
                            "metricType": "FILE_PRESENT",
                            "metricName": "File present",
                            "position": f"FILE_{idx+1}",
                            "value": float(idx + 1),
                            "units": None,
                            "temperature": None,
                            "frequency": None,
                            "sourceFileId": f["id"],
                            "sourcePage": None,
                            "language": None,
                            "confidence": None,
                        }
                    )

            for metric in metric_rows:
                cur.execute(
                    """
                    INSERT INTO "BinderTestMetric" (
                      "id", "binderTestId", "parseRunId", "metricType", "metricName",
                      "position", "value", "units", "temperature", "frequency",
                      "sourceFileId", "sourcePage", "language", "confidence",
                      "isUserConfirmed", "createdAt", "updatedAt"
                    ) VALUES (
                      %s, %s, %s, %s, %s,
                      %s, %s, %s, %s, %s,
                      %s, %s, %s, %s,
                      false, NOW(), NOW()
                    )
                    """,
                    (
                        str(uuid4()),
                        binder_test_id,
                        parse_run_id,
                        metric["metricType"],
                        metric.get("metricName"),
                        metric.get("position"),
                        metric.get("value"),
                        metric.get("units"),
                        metric.get("temperature"),
                        metric.get("frequency"),
                        metric.get("sourceFileId"),
                        metric.get("sourcePage"),
                        metric.get("language"),
                        metric.get("confidence"),
                    ),
                )
                inserted_count += 1

            cur.execute(
                """
                UPDATE "BinderTestParseRun"
                SET "status" = %s, "completedAt" = NOW()
                WHERE "id" = %s
                """,
                ("COMPLETED", parse_run_id),
            )
            log_audit_event(
                cur,
                binder_test_id,
                "PARSE_COMPLETED",
                entity_type="parse_run",
                entity_id=parse_run_id,
                after={"status": "COMPLETED", "metricsInserted": inserted_count},
                user_id=x_user_id,
                user_role=x_user_role,
            )
            log_audit_event(
                cur,
                binder_test_id,
                "METRICS_UPSERTED",
                entity_type="parse_run",
                entity_id=parse_run_id,
                after={"count": inserted_count},
                user_id=x_user_id,
                user_role=x_user_role,
            )
            cur.execute(
                'UPDATE "BinderTest" SET "lifecycleStatus" = %s, "status" = %s, "updatedAt" = NOW() WHERE "id" = %s',
                ("REVIEW_REQUIRED", "PENDING_REVIEW", binder_test_id),
            )
            conn.commit()
        except Exception as exc:
            conn.rollback()
            with get_conn() as fail_conn, fail_conn.cursor() as fail_cur:
                fail_cur.execute(
                    'UPDATE "BinderTestParseRun" SET "status" = %s, "errorMessage" = %s, "completedAt" = NOW() WHERE "id" = %s',
                    ("FAILED", str(exc), parse_run_id),
                )
                log_audit_event(
                    fail_cur,
                    binder_test_id,
                    "PARSE_COMPLETED",
                    entity_type="parse_run",
                    entity_id=parse_run_id,
                    after={"status": "FAILED", "error": str(exc)},
                    user_id=x_user_id,
                    user_role=x_user_role,
                )
                fail_conn.commit()
            raise

    return {"status": "PARSED", "metricsInserted": inserted_count, "parseRunId": parse_run_id}


@app.get("/binder-tests/{binder_test_id}/metrics", response_model=List[BinderTestMetric])
def list_binder_test_metrics(binder_test_id: str):
    _load_binder_test_basic(binder_test_id)
    rows = fetch_all(
        """
        SELECT
          m."id",
          m."metricType",
          COALESCE(m."metricName", m."metricType") AS "metricName",
          m."position",
          m."value",
          m."units",
          m."temperature",
          m."frequency",
          m."sourceFileId",
          m."sourcePage",
          m."language",
          m."confidence",
          m."isUserConfirmed",
          m."parseRunId",
          CASE
            WHEN f."id" IS NOT NULL THEN json_build_object('id', f."id", 'filename', COALESCE(f."label", f."fileUrl"))
            ELSE NULL
          END AS "sourceFile"
        FROM "BinderTestMetric" m
        LEFT JOIN "BinderTestDataFile" f ON f."id" = m."sourceFileId"
        WHERE m."binderTestId" = %s
        ORDER BY m."createdAt" ASC
        """,
        (binder_test_id,),
    )
    for row in rows:
        row["value"] = decimal_to_float(row.get("value"))
        row["temperature"] = decimal_to_float(row.get("temperature"))
        row["frequency"] = decimal_to_float(row.get("frequency"))
    return rows


@app.post("/binder-tests/{binder_test_id}/confirm")
def confirm_binder_test_metrics(
    binder_test_id: str,
    x_user_id: Optional[str] = Header(None, convert_underscores=False),
    x_user_role: Optional[str] = Header(None, convert_underscores=False),
):
    _load_binder_test_basic(binder_test_id)
    metrics = fetch_all(
        'SELECT "id", "position", "isUserConfirmed" FROM "BinderTestMetric" WHERE "binderTestId" = %s',
        (binder_test_id,),
    )
    if not metrics:
        raise HTTPException(status_code=400, detail="No metrics to confirm")
    has_unknown_position = any((m.get("position") or "").upper() == "UNKNOWN" for m in metrics)
    if has_unknown_position:
        raise HTTPException(status_code=400, detail='Cannot confirm while metrics contain position "UNKNOWN"')

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE "BinderTestMetric"
            SET
              "isUserConfirmed" = true,
              "confirmedByUserId" = %s,
              "confirmedByRole" = %s,
              "confirmedAt" = NOW(),
              "updatedAt" = NOW()
            WHERE "binderTestId" = %s AND "isUserConfirmed" = false
            """,
            (x_user_id, x_user_role, binder_test_id),
        )
        metrics_confirmed = cur.rowcount
        cur.execute(
            'UPDATE "BinderTest" SET "lifecycleStatus" = %s, "status" = %s, "updatedAt" = NOW() WHERE "id" = %s',
            ("READY", "READY", binder_test_id),
        )
        log_audit_event(
            cur,
            binder_test_id,
            "METRICS_CONFIRMED",
            entity_type="metric",
            after={"count": metrics_confirmed},
            user_id=x_user_id,
            user_role=x_user_role,
        )
        conn.commit()

    return {"status": "READY", "metricsConfirmed": metrics_confirmed}


@app.post("/binder-tests/{binder_test_id}/summaries")
def create_binder_test_summary(
    binder_test_id: str,
    x_user_id: Optional[str] = Header(None, convert_underscores=False),
    x_user_role: Optional[str] = Header(None, convert_underscores=False),
):
    binder = _load_binder_test_basic(binder_test_id)
    lifecycle = binder.get("lifecycleStatus") or binder.get("status")
    if lifecycle != "READY":
        raise HTTPException(status_code=400, detail="Binder test must be READY to create summary")

    metrics = fetch_all(
        """
        SELECT
          "id", "metricType", "metricName", "position", "value", "units",
          "temperature", "frequency", "sourceFileId", "sourcePage", "language",
          "confidence", "parseRunId"
        FROM "BinderTestMetric"
        WHERE "binderTestId" = %s AND "isUserConfirmed" = true
        ORDER BY "createdAt" ASC
        """,
        (binder_test_id,),
    )
    if not metrics:
        raise HTTPException(status_code=400, detail="No confirmed metrics to summarize")

    derived_hash = _stable_metrics_hash(metrics)
    next_version_row = fetch_one(
        'SELECT COALESCE(MAX("version"), 0) + 1 AS "nextVersion" FROM "BinderTestSummary" WHERE "binderTestId" = %s',
        (binder_test_id,),
    )
    next_version = int(next_version_row["nextVersion"]) if next_version_row else 1
    summary_id = str(uuid4())

    parse_run_row = fetch_one(
        """
        SELECT "id", "inputFileIds"
        FROM "BinderTestParseRun"
        WHERE "binderTestId" = %s AND "status" = 'COMPLETED'
        ORDER BY "startedAt" DESC
        LIMIT 1
        """,
        (binder_test_id,),
    )
    input_file_ids = parse_run_row.get("inputFileIds") if parse_run_row else []
    evidence_lookup = _hydrate_source_files(input_file_ids or [])
    evidence_files = [
        {"id": fid, "filename": evidence_lookup.get(fid)}
        for fid in input_file_ids or []
    ]

    now = datetime.utcnow()
    doi_like_id = f"ecotek.binder.{now.year}.{now.strftime('%m%d')}.{binder_test_id[:8]}v{next_version}"
    summary_json = {
        "binder_test_id": binder_test_id,
        "version": next_version,
        "doi_like_id": doi_like_id,
        "created_at": now.isoformat() + "Z",
        "created_by_user_id": x_user_id,
        "created_by_role": x_user_role,
        "metrics": metrics,
        "evidence_files": evidence_files,
        "notes": "Derived from confirmed metrics only.",
    }

    with get_conn() as conn, conn.cursor() as cur:
        prev_summary = fetch_one(
            """
            SELECT "id", "version"
            FROM "BinderTestSummary"
            WHERE "binderTestId" = %s
            ORDER BY "version" DESC
            LIMIT 1
            """,
            (binder_test_id,),
        )
        cur.execute(
            """
            INSERT INTO "BinderTestSummary" (
              "id", "binderTestId", "version", "doiLikeId", "status",
              "createdAt", "createdByUserId", "createdByRole",
              "derivedFromMetricsHash", "summaryJson", "supersedesSummaryId"
            ) VALUES (
              %s, %s, %s, %s, %s,
              %s, %s, %s,
              %s, %s, %s
            )
            """,
            (
                summary_id,
                binder_test_id,
                next_version,
                doi_like_id,
                "FINAL",
                now,
                x_user_id,
                x_user_role,
                derived_hash,
                summary_json,
                prev_summary["id"] if prev_summary else None,
            ),
        )
        if prev_summary:
            cur.execute(
                'UPDATE "BinderTestSummary" SET "status" = %s WHERE "id" = %s',
                ("SUPERSEDED", prev_summary["id"]),
            )
            log_audit_event(
                cur,
                binder_test_id,
                "SUMMARY_SUPERSEDED",
                entity_type="summary",
                entity_id=prev_summary["id"],
                after={"supersededBy": summary_id},
                user_id=x_user_id,
                user_role=x_user_role,
            )

        log_audit_event(
            cur,
            binder_test_id,
            "SUMMARY_CREATED",
            entity_type="summary",
            entity_id=summary_id,
            after={"version": next_version, "doiLikeId": doi_like_id},
            user_id=x_user_id,
            user_role=x_user_role,
        )
        conn.commit()

    return {"version": next_version, "doiLikeId": doi_like_id, "summaryId": summary_id}


@app.get("/binder-tests/{binder_test_id}/summaries", response_model=List[BinderTestSummaryListItem])
def list_binder_test_summaries(binder_test_id: str):
    _load_binder_test_basic(binder_test_id)
    rows = fetch_all(
        """
        SELECT
          "version",
          "doiLikeId",
          "status",
          "createdAt",
          "createdByUserId",
          "createdByRole",
          "supersedesSummaryId"
        FROM "BinderTestSummary"
        WHERE "binderTestId" = %s
        ORDER BY "version" DESC
        """,
        (binder_test_id,),
    )
    return rows


@app.get("/binder-tests/{binder_test_id}/summaries/{version}", response_model=BinderTestSummaryDetail)
def get_binder_test_summary(binder_test_id: str, version: int):
    row = fetch_one(
        """
        SELECT
          "id",
          "binderTestId",
          "version",
          "doiLikeId",
          "status",
          "createdAt",
          "createdByUserId",
          "createdByRole",
          "derivedFromMetricsHash",
          "summaryJson",
          "supersedesSummaryId"
        FROM "BinderTestSummary"
        WHERE "binderTestId" = %s AND "version" = %s
        """,
        (binder_test_id, version),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Summary not found")
    return row


@app.post("/binder-tests/{binder_test_id}/peer-comments", response_model=BinderTestPeerComment)
def create_peer_comment(
    binder_test_id: str,
    payload: dict,
    x_user_id: Optional[str] = Header(None, convert_underscores=False),
    x_user_role: Optional[str] = Header(None, convert_underscores=False),
):
    _load_binder_test_basic(binder_test_id)
    comment_type = (payload.get("commentType") or "").upper()
    comment_text = payload.get("commentText")
    summary_version = payload.get("summaryVersion")
    if not comment_type or not comment_text:
        raise HTTPException(status_code=400, detail="commentType and commentText are required")
    comment_id = str(uuid4())

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "BinderTestPeerComment" (
              "id", "binderTestId", "summaryVersion", "commentType",
              "commentText", "createdByUserId", "createdByRole", "createdAt",
              "resolved"
            ) VALUES (
              %s, %s, %s, %s,
              %s, %s, %s, NOW(),
              false
            )
            RETURNING
              "id", "binderTestId", "summaryVersion", "commentType", "commentText",
              "createdByUserId", "createdByRole", "createdAt", "resolved",
              "resolvedByUserId", "resolvedAt"
            """,
            (
                comment_id,
                binder_test_id,
                summary_version,
                comment_type,
                comment_text,
                x_user_id,
                x_user_role,
            ),
        )
        created = cur.fetchone()
        log_audit_event(
            cur,
            binder_test_id,
            "PEER_COMMENT_ADDED",
            entity_type="comment",
            entity_id=comment_id,
            after={"summaryVersion": summary_version, "commentType": comment_type},
            user_id=x_user_id,
            user_role=x_user_role,
        )
        conn.commit()
    return created


@app.get("/binder-tests/{binder_test_id}/peer-comments", response_model=List[BinderTestPeerComment])
def list_peer_comments(binder_test_id: str, version: Optional[int] = None):
    _load_binder_test_basic(binder_test_id)
    clauses = ['"binderTestId" = %s']
    params: list[Any] = [binder_test_id]
    if version is not None:
        clauses.append('"summaryVersion" = %s')
        params.append(version)

    where_sql = " AND ".join(clauses)
    rows = fetch_all(
        f"""
        SELECT
          "id", "binderTestId", "summaryVersion", "commentType", "commentText",
          "createdByUserId", "createdByRole", "createdAt",
          "resolved", "resolvedByUserId", "resolvedAt"
        FROM "BinderTestPeerComment"
        WHERE {where_sql}
        ORDER BY "createdAt" DESC
        """,
        params,
    )
    return rows


@app.post("/binder-tests/{binder_test_id}/peer-review-decisions", response_model=BinderTestPeerReviewDecision)
def create_peer_review_decision(
    binder_test_id: str,
    payload: dict,
    x_user_id: Optional[str] = Header(None, convert_underscores=False),
    x_user_role: Optional[str] = Header(None, convert_underscores=False),
):
    _load_binder_test_basic(binder_test_id)
    summary_version = payload.get("summaryVersion")
    decision = (payload.get("decision") or "").upper()
    notes = payload.get("decisionNotes")
    if summary_version is None or not decision:
        raise HTTPException(status_code=400, detail="summaryVersion and decision are required")
    decision_id = str(uuid4())

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "BinderTestPeerReviewDecision" (
              "id", "binderTestId", "summaryVersion", "decision", "decisionNotes",
              "reviewerUserId", "reviewerRole", "createdAt"
            ) VALUES (
              %s, %s, %s, %s, %s,
              %s, %s, NOW()
            )
            RETURNING
              "id", "binderTestId", "summaryVersion", "decision", "decisionNotes",
              "reviewerUserId", "reviewerRole", "createdAt"
            """,
            (
                decision_id,
                binder_test_id,
                summary_version,
                decision,
                notes,
                x_user_id,
                x_user_role,
            ),
        )
        created = cur.fetchone()
        log_audit_event(
            cur,
            binder_test_id,
            "PEER_REVIEW_DECISION_ADDED",
            entity_type="review_decision",
            entity_id=decision_id,
            after={"summaryVersion": summary_version, "decision": decision},
            user_id=x_user_id,
            user_role=x_user_role,
        )
        conn.commit()
    return created


@app.get("/binder-tests/{binder_test_id}/peer-review-decisions", response_model=List[BinderTestPeerReviewDecision])
def list_peer_review_decisions(binder_test_id: str, version: int):
    _load_binder_test_basic(binder_test_id)
    rows = fetch_all(
        """
        SELECT
          "id", "binderTestId", "summaryVersion", "decision", "decisionNotes",
          "reviewerUserId", "reviewerRole", "createdAt"
        FROM "BinderTestPeerReviewDecision"
        WHERE "binderTestId" = %s AND "summaryVersion" = %s
        ORDER BY "createdAt" DESC
        """,
        (binder_test_id, version),
    )
    return rows


@app.get("/binder-tests/{binder_test_id}/audit", response_model=List[BinderTestAuditEvent])
def list_audit_events(binder_test_id: str):
    _load_binder_test_basic(binder_test_id)
    rows = fetch_all(
        """
        SELECT
          "id",
          "binderTestId",
          "eventType",
          "entityType",
          "entityId",
          "performedByUserId",
          "performedByRole",
          "performedAt",
          "beforeJson",
          "afterJson",
          "notes"
        FROM "BinderTestAuditEvent"
        WHERE "binderTestId" = %s
        ORDER BY "performedAt" DESC
        """,
        (binder_test_id,),
    )
    return rows


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


class DbQueryRequest(BaseModel):
    query: str
    params: Optional[List[Any]] = None


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
            INSERT INTO "CapsuleFormula" ("name", "description", "createdById", "updatedAt")
            VALUES (%s, %s, %s, NOW())
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
                    "description" = %s,
                    "updatedAt" = NOW()
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


@app.post("/db/query")
def db_query(payload: DbQueryRequest):
    # Convert Postgres-style $1 placeholders to psycopg paramstyle (%s)
    rewritten_sql = re.sub(r"\$\d+", "%s", payload.query)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(rewritten_sql, payload.params or [])
        if cur.description:
            rows = cur.fetchall()
            return {"ok": True, "rows": rows}
        return {"ok": True, "rowcount": cur.rowcount}


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


@app.post("/db/pma-formulas", response_model=PmaFormulaResponse)
def create_pma_formula(payload: PmaFormulaCreate):
    # Basic validation: ensure capsule and origin exist
    capsule = fetch_one('SELECT "id" FROM "CapsuleFormula" WHERE "id" = %s', (payload.capsuleFormulaId,))
    if not capsule:
        raise HTTPException(status_code=400, detail="Capsule formula not found")
    origin = fetch_one('SELECT "id" FROM "BitumenOrigin" WHERE "id" = %s', (payload.bitumenOriginId,))
    if not origin:
        raise HTTPException(status_code=400, detail="Bitumen origin not found")

    if payload.bitumenTestId:
        test = fetch_one('SELECT "id" FROM "BitumenBaseTest" WHERE "id" = %s', (payload.bitumenTestId,))
        if not test:
            raise HTTPException(status_code=400, detail="Bitumen base test not found")

    new_id = str(uuid4())
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "PmaFormula" (
              "id", "name", "capsuleFormulaId", "bitumenOriginId", "bitumenTestId",
              "ecoCapPercentage", "reagentPercentage", "mixRpm", "mixTimeMinutes",
              "pmaTargetPgHigh", "pmaTargetPgLow", "bitumenGradeOverride", "notes",
              "createdAt", "updatedAt"
            ) VALUES (
              %s, %s, %s, %s, %s,
              %s, %s, %s, %s,
              %s, %s, %s, %s,
              NOW(), NOW()
            )
            """,
            (
                new_id,
                payload.name,
                payload.capsuleFormulaId,
                payload.bitumenOriginId,
                payload.bitumenTestId,
                payload.ecoCapPercentage,
                payload.reagentPercentage,
                payload.mixRpm,
                payload.mixTimeMinutes,
                payload.pmaTargetPgHigh,
                payload.pmaTargetPgLow,
                payload.bitumenGradeOverride,
                payload.notes,
            ),
        )
        conn.commit()

    created = fetch_one(
        """
        SELECT
          pf."id",
          pf."name",
          pf."capsuleFormulaId",
          pf."bitumenOriginId",
          pf."bitumenTestId",
          pf."ecoCapPercentage",
          pf."reagentPercentage",
          pf."mixRpm",
          pf."mixTimeMinutes",
          pf."pmaTargetPgHigh",
          pf."pmaTargetPgLow",
          pf."bitumenGradeOverride",
          pf."notes",
          pf."createdAt",
          pf."updatedAt",
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
          (SELECT COUNT(*) FROM "PmaBatch" pb WHERE pb."pmaFormulaId" = pf."id") AS "batchCount"
        FROM "PmaFormula" pf
        WHERE pf."id" = %s
        """,
        (new_id,),
    )
    return created

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
