-- CreateEnum
CREATE TYPE "RequirementComparison" AS ENUM ('LTE', 'GTE', 'BETWEEN');

-- CreateTable
CREATE TABLE "Formulation" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ecoCapPercentage" DOUBLE PRECISION,
    "reagentPercentage" DOUBLE PRECISION,
    "bitumenGrade" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "formulationId" INTEGER NOT NULL,
    "dateMixed" TIMESTAMP(3) NOT NULL,
    "operator" TEXT,
    "rpm" INTEGER,
    "mixingTempInitial" DOUBLE PRECISION,
    "mixingTempFinal" DOUBLE PRECISION,
    "mixingDurationMinutes" INTEGER,
    "mixingNotes" TEXT,
    "mixingCurve" JSONB,
    "reagentPercentage" DOUBLE PRECISION,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderTest" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "storabilityPct" DOUBLE PRECISION,
    "solubilityPct" DOUBLE PRECISION,
    "elasticRecoveryPct" DOUBLE PRECISION,
    "softeningPointC" DOUBLE PRECISION,
    "ductilityCm" DOUBLE PRECISION,
    "jnr_0_1" DOUBLE PRECISION,
    "jnr_3_2" DOUBLE PRECISION,
    "r_0_1" DOUBLE PRECISION,
    "r_3_2" DOUBLE PRECISION,
    "rDiffPct" DOUBLE PRECISION,
    "jnrDiffPct" DOUBLE PRECISION,
    "mscrIndication" TEXT,
    "mscrGrade" TEXT,
    "viscosity155c" DOUBLE PRECISION,
    "flashPointC" DOUBLE PRECISION,
    "gstarOriginal" DOUBLE PRECISION,
    "gstarRtfo" DOUBLE PRECISION,
    "gstarPav" DOUBLE PRECISION,
    "stiffnessMpa" DOUBLE PRECISION,
    "mValue" DOUBLE PRECISION,
    "notes" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "marketId" INTEGER NOT NULL,

    CONSTRAINT "Standard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardRequirement" (
    "id" SERIAL NOT NULL,
    "standardId" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "comparison" "RequirementComparison" NOT NULL,
    "thresholdMin" DOUBLE PRECISION,
    "thresholdMax" DOUBLE PRECISION,
    "unit" TEXT,
    "notes" TEXT,

    CONSTRAINT "StandardRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceResult" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "standardId" INTEGER NOT NULL,
    "storabilityPass" BOOLEAN,
    "solubilityPass" BOOLEAN,
    "jnrPass" BOOLEAN,
    "recoveryPass" BOOLEAN,
    "softeningPass" BOOLEAN,
    "ductilityPass" BOOLEAN,
    "viscosityPass" BOOLEAN,
    "overallPass" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Formulation_slug_key" ON "Formulation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Formulation_code_key" ON "Formulation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_slug_key" ON "Batch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchCode_key" ON "Batch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_code_key" ON "Standard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceResult_testId_standardId_key" ON "ComplianceResult"("testId", "standardId");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTest" ADD CONSTRAINT "BinderTest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardRequirement" ADD CONSTRAINT "StandardRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceResult" ADD CONSTRAINT "ComplianceResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "BinderTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceResult" ADD CONSTRAINT "ComplianceResult_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

