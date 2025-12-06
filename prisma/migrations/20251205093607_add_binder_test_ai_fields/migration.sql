-- CreateEnum
CREATE TYPE "BinderTestStatus" AS ENUM ('PENDING_REVIEW', 'READY', 'ARCHIVED');

-- CreateTable
CREATE TABLE "BinderTest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "batchId" TEXT,
    "binderSource" TEXT,
    "operator" TEXT,
    "lab" TEXT,
    "crmPct" DOUBLE PRECISION,
    "reagentPct" DOUBLE PRECISION,
    "aerosilPct" DOUBLE PRECISION,
    "notes" TEXT,
    "pgHigh" INTEGER,
    "pgLow" INTEGER,
    "softeningPointC" DOUBLE PRECISION,
    "viscosity155_cP" DOUBLE PRECISION,
    "ductilityCm" DOUBLE PRECISION,
    "recoveryPct" DOUBLE PRECISION,
    "jnr_3_2" DOUBLE PRECISION,
    "dsrData" JSONB,
    "originalFiles" JSONB NOT NULL,
    "aiExtractedData" JSONB,
    "aiConfidence" DOUBLE PRECISION,
    "manualEdits" JSONB,
    "status" "BinderTestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',

    CONSTRAINT "BinderTest_pkey" PRIMARY KEY ("id")
);
