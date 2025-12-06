-- AlterTable
ALTER TABLE "BinderTest" ADD COLUMN     "pmaFormulaId" TEXT;

-- AddForeignKey
ALTER TABLE "BinderTest" ADD CONSTRAINT "BinderTest_pmaFormulaId_fkey" FOREIGN KEY ("pmaFormulaId") REFERENCES "PmaFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
