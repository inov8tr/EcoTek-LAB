-- Generated via prisma migrate diff
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

ALTER TABLE "BinderTestDocument" ADD CONSTRAINT "BinderTestDocument_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES "BinderTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
