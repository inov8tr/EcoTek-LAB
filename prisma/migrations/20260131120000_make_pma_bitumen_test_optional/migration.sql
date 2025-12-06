-- Make bitumenTestId optional on PMA formulas
ALTER TABLE "PmaFormula" DROP CONSTRAINT IF EXISTS "PmaFormula_bitumenTestId_fkey";
ALTER TABLE "PmaFormula" ALTER COLUMN "bitumenTestId" DROP NOT NULL;
ALTER TABLE "PmaFormula"
  ADD CONSTRAINT "PmaFormula_bitumenTestId_fkey"
  FOREIGN KEY ("bitumenTestId") REFERENCES "BitumenBaseTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
