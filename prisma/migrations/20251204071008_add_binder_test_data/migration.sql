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

-- AddForeignKey
ALTER TABLE "BinderTestDataResult" ADD CONSTRAINT "BinderTestDataResult_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTestDataFile" ADD CONSTRAINT "BinderTestDataFile_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderTestDataMedia" ADD CONSTRAINT "BinderTestDataMedia_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
