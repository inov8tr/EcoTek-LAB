-- Binder Tests rebuild additions
-- This migration keeps legacy BinderTest rows intact while adding the
-- versioned summaries, parse lineage, peer review, and audit structures.

-- Lightweight lifecycle tracking to avoid overloading the legacy enum
ALTER TABLE "BinderTest"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" text DEFAULT 'CREATED',
  ADD COLUMN IF NOT EXISTS "testPurpose" text,
  ADD COLUMN IF NOT EXISTS "materialDescription" text,
  ADD COLUMN IF NOT EXISTS "testStandard" text,
  ADD COLUMN IF NOT EXISTS "keywords" jsonb;

CREATE TABLE IF NOT EXISTS "BinderTestAuditEvent" (
  "id" uuid PRIMARY KEY,
  "binderTestId" text NOT NULL REFERENCES "BinderTest"("id") ON DELETE CASCADE,
  "eventType" text NOT NULL,
  "entityType" text,
  "entityId" text,
  "performedByUserId" text,
  "performedByRole" text,
  "performedAt" timestamptz NOT NULL DEFAULT now(),
  "beforeJson" jsonb,
  "afterJson" jsonb,
  "notes" text
);

CREATE INDEX IF NOT EXISTS "BinderTestAuditEvent_binderTestId_idx" ON "BinderTestAuditEvent" ("binderTestId");
CREATE INDEX IF NOT EXISTS "BinderTestAuditEvent_performedAt_idx" ON "BinderTestAuditEvent" ("performedAt" DESC);

CREATE TABLE IF NOT EXISTS "BinderTestParseRun" (
  "id" uuid PRIMARY KEY,
  "binderTestId" text NOT NULL REFERENCES "BinderTest"("id") ON DELETE CASCADE,
  "inputFileIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "inputFilesHash" text NOT NULL,
  "parserVersion" text,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "completedAt" timestamptz,
  "status" text NOT NULL,
  "errorMessage" text
);

CREATE INDEX IF NOT EXISTS "BinderTestParseRun_binderTestId_idx" ON "BinderTestParseRun" ("binderTestId");
CREATE INDEX IF NOT EXISTS "BinderTestParseRun_status_idx" ON "BinderTestParseRun" ("status");

CREATE TABLE IF NOT EXISTS "BinderTestMetric" (
  "id" uuid PRIMARY KEY,
  "binderTestId" text NOT NULL REFERENCES "BinderTest"("id") ON DELETE CASCADE,
  "parseRunId" uuid REFERENCES "BinderTestParseRun"("id") ON DELETE SET NULL,
  "metricType" text NOT NULL,
  "metricName" text,
  "position" text,
  "value" double precision,
  "units" text,
  "temperature" double precision,
  "frequency" double precision,
  "sourceFileId" text,
  "sourcePage" integer,
  "language" text,
  "confidence" double precision,
  "isUserConfirmed" boolean NOT NULL DEFAULT false,
  "confirmedByUserId" text,
  "confirmedByRole" text,
  "confirmedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "BinderTestMetric_binderTestId_idx" ON "BinderTestMetric" ("binderTestId");
CREATE INDEX IF NOT EXISTS "BinderTestMetric_parseRunId_idx" ON "BinderTestMetric" ("parseRunId");

CREATE TABLE IF NOT EXISTS "BinderTestSummary" (
  "id" uuid PRIMARY KEY,
  "binderTestId" text NOT NULL REFERENCES "BinderTest"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "doiLikeId" text NOT NULL UNIQUE,
  "status" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "createdByUserId" text,
  "createdByRole" text,
  "derivedFromMetricsHash" text NOT NULL,
  "summaryJson" jsonb NOT NULL,
  "supersedesSummaryId" uuid REFERENCES "BinderTestSummary"("id") ON DELETE SET NULL,
  CONSTRAINT "BinderTestSummary_version_unique" UNIQUE ("binderTestId", "version")
);

CREATE INDEX IF NOT EXISTS "BinderTestSummary_binderTestId_idx" ON "BinderTestSummary" ("binderTestId");
CREATE INDEX IF NOT EXISTS "BinderTestSummary_status_idx" ON "BinderTestSummary" ("status");

CREATE TABLE IF NOT EXISTS "BinderTestPeerComment" (
  "id" uuid PRIMARY KEY,
  "binderTestId" text NOT NULL REFERENCES "BinderTest"("id") ON DELETE CASCADE,
  "summaryVersion" integer,
  "commentType" text NOT NULL,
  "commentText" text NOT NULL,
  "createdByUserId" text,
  "createdByRole" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolved" boolean NOT NULL DEFAULT false,
  "resolvedByUserId" text,
  "resolvedAt" timestamptz
);

CREATE INDEX IF NOT EXISTS "BinderTestPeerComment_binderTestId_idx" ON "BinderTestPeerComment" ("binderTestId");
CREATE INDEX IF NOT EXISTS "BinderTestPeerComment_summaryVersion_idx" ON "BinderTestPeerComment" ("summaryVersion");

CREATE TABLE IF NOT EXISTS "BinderTestPeerReviewDecision" (
  "id" uuid PRIMARY KEY,
  "binderTestId" text NOT NULL REFERENCES "BinderTest"("id") ON DELETE CASCADE,
  "summaryVersion" integer NOT NULL,
  "decision" text NOT NULL,
  "decisionNotes" text,
  "reviewerUserId" text,
  "reviewerRole" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "BinderTestPeerReviewDecision_binderTestId_idx" ON "BinderTestPeerReviewDecision" ("binderTestId");
CREATE INDEX IF NOT EXISTS "BinderTestPeerReviewDecision_summaryVersion_idx" ON "BinderTestPeerReviewDecision" ("summaryVersion");
