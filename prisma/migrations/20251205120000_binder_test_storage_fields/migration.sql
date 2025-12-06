-- Generated via prisma migrate diff
ALTER TABLE "BinderTest"
    ADD COLUMN "folderName" TEXT NOT NULL DEFAULT 'legacy-binder-test',
    ADD COLUMN "testName" TEXT NOT NULL DEFAULT 'Untitled Binder Test',
    ALTER COLUMN "name" DROP NOT NULL;
