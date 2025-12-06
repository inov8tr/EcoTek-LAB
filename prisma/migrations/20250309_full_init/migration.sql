-- CreateEnum
CREATE TYPE "TestOutcome" AS ENUM ('PASS', 'FAIL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "BinderTestStatus" AS ENUM ('PENDING_REVIEW', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RESEARCHER', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DeleteStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequirementComparison" AS ENUM ('LTE', 'GTE', 'BETWEEN');

-- CreateTable
CREATE TABLE "Formulation" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ecoCapPercentage" DOUBLE PRECISION,
    "reagentPercentage" DOUBLE PRECISION,
    "bitumenGrade" TEXT,
    "notes" TEXT,
    "targetPgHigh" INTEGER,
    "targetPgLow" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Formulation_pkey" PRIMARY KEY ("id")
);

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
    "capsuleDosagePct" DOUBLE PRECISION,
    "binderName" TEXT,
    "binderPgHigh" INTEGER,
    "binderPgLow" INTEGER,
    "mixingTempC" DOUBLE PRECISION,
    "mixingTimeMin" DOUBLE PRECISION,
    "shearRpm" INTEGER,
    "testDate" TIMESTAMP(3),
    "labName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "BinderTest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "testName" TEXT NOT NULL DEFAULT 'Untitled Binder Test',
    "folderName" TEXT NOT NULL DEFAULT 'legacy-binder-test',
    "pmaFormulaId" TEXT,
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

-- CreateTable
CREATE TABLE "BinderTestDocument" (
    "id" TEXT NOT NULL,
    "binderTestId" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "testNumber" TEXT,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderTestDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderTestData" (
    "id" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "batchId" TEXT,
    "binderSource" TEXT,
    "crmPercent" DOUBLE PRECISION,
    "reagentPercent" DOUBLE PRECISION,
    "aerosilPercent" DOUBLE PRECISION,
    "operator" TEXT,
    "lab" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderTestData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderTestDataResult" (
    "id" TEXT NOT NULL,
    "binderTestId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "gOriginal" DOUBLE PRECISION,
    "gRtfo" DOUBLE PRECISION,
    "gPav" DOUBLE PRECISION,
    "pgHigh" INTEGER,
    "pgLow" INTEGER,
    "passFail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderTestDataResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderTestDataFile" (
    "id" TEXT NOT NULL,
    "binderTestId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderTestDataFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderTestDataMedia" (
    "id" TEXT NOT NULL,
    "binderTestId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderTestDataMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "handle" TEXT,
    "pronouns" TEXT,
    "bio" TEXT,
    "locale" TEXT DEFAULT 'en-US',
    "timeZone" TEXT DEFAULT 'UTC',
    "theme" TEXT DEFAULT 'system',
    "loginAlerts" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "notificationEmailOptIn" BOOLEAN NOT NULL DEFAULT true,
    "notificationPushOptIn" BOOLEAN NOT NULL DEFAULT false,
    "notificationInAppOptIn" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "detail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "category" TEXT,
    "channel" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "batchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" SERIAL NOT NULL,
    "targetTable" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DeleteStatus" NOT NULL DEFAULT 'PENDING',
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
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
    "name" TEXT NOT NULL DEFAULT 'PMA Formula',
    "capsuleFormulaId" TEXT NOT NULL,
    "bitumenOriginId" TEXT NOT NULL,
    "bitumenTestId" TEXT,
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
    "dsrOriginalTemp" DOUBLE PRECISION,
    "dsrOriginalGOverSin" DOUBLE PRECISION,
    "dsrRtfoTemp" DOUBLE PRECISION,
    "dsrRtfoGOverSin" DOUBLE PRECISION,
    "dsrPavTemp" DOUBLE PRECISION,
    "dsrPavGTimesSin" DOUBLE PRECISION,
    "bbrTemp" DOUBLE PRECISION,
    "bbrStiffness" DOUBLE PRECISION,
    "bbrMValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmaTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Formulation_slug_key" ON "Formulation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Formulation_code_key" ON "Formulation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_slug_key" ON "Batch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchCode_key" ON "Batch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Session_jti_key" ON "Session"("jti");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "RecoveryCode"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_readAt_idx" ON "SecurityEvent"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TestStandard_name_key" ON "TestStandard"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_code_key" ON "Standard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PmaBatch_batchCode_key" ON "PmaBatch"("batchCode");

-- AddForeignKey
ALTER TABLE "FormulationComponent" ADD CONSTRAINT "FormulationComponent_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulationComponent" ADD CONSTRAINT "FormulationComponent_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTest" ADD CONSTRAINT "BinderTest_pmaFormulaId_fkey" FOREIGN KEY ("pmaFormulaId") REFERENCES "PmaFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTestDocument" ADD CONSTRAINT "BinderTestDocument_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTestDataResult" ADD CONSTRAINT "BinderTestDataResult_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTestDataFile" ADD CONSTRAINT "BinderTestDataFile_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTestDataMedia" ADD CONSTRAINT "BinderTestDataMedia_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardRequirement" ADD CONSTRAINT "StandardRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "PmaFormula" ADD CONSTRAINT "PmaFormula_bitumenTestId_fkey" FOREIGN KEY ("bitumenTestId") REFERENCES "BitumenBaseTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaBatch" ADD CONSTRAINT "PmaBatch_pmaFormulaId_fkey" FOREIGN KEY ("pmaFormulaId") REFERENCES "PmaFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaBatch" ADD CONSTRAINT "PmaBatch_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmaTestResult" ADD CONSTRAINT "PmaTestResult_pmaBatchId_fkey" FOREIGN KEY ("pmaBatchId") REFERENCES "PmaBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

