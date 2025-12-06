-- DropForeignKey
ALTER TABLE "BinderTest" DROP CONSTRAINT "BinderTest_batchId_fkey";

-- DropForeignKey
ALTER TABLE "ComplianceResult" DROP CONSTRAINT "ComplianceResult_standardId_fkey";

-- DropForeignKey
ALTER TABLE "ComplianceResult" DROP CONSTRAINT "ComplianceResult_testId_fkey";

-- DropForeignKey
ALTER TABLE "FileAttachment" DROP CONSTRAINT "FileAttachment_binderTestId_fkey";

-- AlterTable
ALTER TABLE "FileAttachment" DROP COLUMN "binderTestId";

-- DropTable
DROP TABLE "BinderTest";

-- DropTable
DROP TABLE "ComplianceResult";

