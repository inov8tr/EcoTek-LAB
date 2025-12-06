-- CreateEnum
CREATE TYPE "TestOutcome" AS ENUM ('PASS', 'FAIL', 'PARTIAL');

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "binderName" TEXT,
ADD COLUMN     "binderPgHigh" INTEGER,
ADD COLUMN     "binderPgLow" INTEGER,
ADD COLUMN     "capsuleDosagePct" DOUBLE PRECISION,
ADD COLUMN     "labName" TEXT,
ADD COLUMN     "mixingTempC" DOUBLE PRECISION,
ADD COLUMN     "mixingTimeMin" DOUBLE PRECISION,
ADD COLUMN     "shearRpm" INTEGER,
ADD COLUMN     "testDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Formulation" ADD COLUMN     "description" TEXT,
ADD COLUMN     "targetPgHigh" INTEGER,
ADD COLUMN     "targetPgLow" INTEGER;

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulationComponent" (
    "id" SERIAL NOT NULL,
    "formulationId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "materialName" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulationComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "label" TEXT,
    "labReportId" TEXT,
    "storabilityPct" DOUBLE PRECISION,
    "solubilityPct" DOUBLE PRECISION,
    "jnr" DOUBLE PRECISION,
    "elasticRecoveryPct" DOUBLE PRECISION,
    "softeningPointC" DOUBLE PRECISION,
    "ductilityCm" DOUBLE PRECISION,
    "viscosityPaS" DOUBLE PRECISION,
    "pgHigh" INTEGER,
    "pgLow" INTEGER,
    "temperatureC" DOUBLE PRECISION,
    "remarks" TEXT,
    "overallOutcome" "TestOutcome" NOT NULL DEFAULT 'PARTIAL',
    "failedReasons" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestStandard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxStorabilityPct" DOUBLE PRECISION,
    "minSolubilityPct" DOUBLE PRECISION,
    "maxJnr" DOUBLE PRECISION,
    "minElasticRecoveryPct" DOUBLE PRECISION,
    "minSofteningPointC" DOUBLE PRECISION,
    "minDuctilityCm" DOUBLE PRECISION,
    "maxViscosityPaS" DOUBLE PRECISION,
    "minPgHigh" INTEGER,
    "maxPgLow" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleFormula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapsuleFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapsuleFormulaMaterial" (
    "id" TEXT NOT NULL,
    "capsuleFormulaId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapsuleFormulaMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitumenOrigin" (
    "id" TEXT NOT NULL,
    "refineryName" TEXT NOT NULL,
    "binderGrade" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BitumenOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitumenBaseTest" (
    "id" TEXT NOT NULL,
    "bitumenOriginId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "softeningPoint" DOUBLE PRECISION,
    "penetration" DOUBLE PRECISION,
    "viscosity135" DOUBLE PRECISION,
    "viscosity165" DOUBLE PRECISION,
    "basePgHigh" INTEGER,
    "basePgLow" INTEGER,
    "baseDuctility" DOUBLE PRECISION,
    "baseRecovery" DOUBLE PRECISION,
    "notes" TEXT,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BitumenBaseTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmaFormula" (
    "id" TEXT NOT NULL,
    "capsuleFormulaId" TEXT NOT NULL,
    "bitumenOriginId" TEXT NOT NULL,
    "bitumenTestId" TEXT NOT NULL,
    "ecoCapPercentage" DOUBLE PRECISION NOT NULL,
    "reagentPercentage" DOUBLE PRECISION NOT NULL,
    "mixRpm" INTEGER,
    "mixTimeMinutes" DOUBLE PRECISION,
    "pmaTargetPgHigh" INTEGER,
    "pmaTargetPgLow" INTEGER,
    "bitumenGradeOverride" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmaFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmaBatch" (
    "id" TEXT NOT NULL,
    "pmaFormulaId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "sampleDate" TIMESTAMP(3),
    "testedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmaBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmaTestResult" (
    "id" TEXT NOT NULL,
    "pmaBatchId" TEXT NOT NULL,
    "softeningPoint" DOUBLE PRECISION,
    "viscosity135" DOUBLE PRECISION,
    "viscosity165" DOUBLE PRECISION,
    "ductility" DOUBLE PRECISION,
    "elasticRecovery" DOUBLE PRECISION,
    "storageStabilityDifference" DOUBLE PRECISION,
    "pgHigh" INTEGER,
    "pgLow" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmaTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TestStandard_name_key" ON "TestStandard"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PmaBatch_batchCode_key" ON "PmaBatch"("batchCode");

-- AddForeignKey
ALTER TABLE "FormulationComponent" ADD CONSTRAINT "FormulationComponent_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulationComponent" ADD CONSTRAINT "FormulationComponent_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleFormula" ADD CONSTRAINT "CapsuleFormula_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapsuleFormulaMaterial" ADD CONSTRAINT "CapsuleFormulaMaterial_capsuleFormulaId_fkey" FOREIGN KEY ("capsuleFormulaId") REFERENCES "CapsuleFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BitumenBaseTest" ADD CONSTRAINT "BitumenBaseTest_bitumenOriginId_fkey" FOREIGN KEY ("bitumenOriginId") REFERENCES "BitumenOrigin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaFormula" ADD CONSTRAINT "PmaFormula_capsuleFormulaId_fkey" FOREIGN KEY ("capsuleFormulaId") REFERENCES "CapsuleFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaFormula" ADD CONSTRAINT "PmaFormula_bitumenOriginId_fkey" FOREIGN KEY ("bitumenOriginId") REFERENCES "BitumenOrigin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaFormula" ADD CONSTRAINT "PmaFormula_bitumenTestId_fkey" FOREIGN KEY ("bitumenTestId") REFERENCES "BitumenBaseTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaBatch" ADD CONSTRAINT "PmaBatch_pmaFormulaId_fkey" FOREIGN KEY ("pmaFormulaId") REFERENCES "PmaFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaBatch" ADD CONSTRAINT "PmaBatch_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaTestResult" ADD CONSTRAINT "PmaTestResult_pmaBatchId_fkey" FOREIGN KEY ("pmaBatchId") REFERENCES "PmaBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
