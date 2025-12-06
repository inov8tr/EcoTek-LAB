CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- The portal now relies on Prisma's `User` table for authentication.
-- This helper script lets you seed additional operators directly in SQL.

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailVerified" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Replace the password hash with `npm run hash-password -- "plain-text"`
INSERT INTO "User" ("email", "passwordHash", "name", "role", "status")
VALUES ('rd-lead@ecotek.com', '$2a$12$replace-with-real-hash', 'EcoTek Lead', 'RESEARCHER', 'ACTIVE')
ON CONFLICT ("email") DO UPDATE
SET "passwordHash" = EXCLUDED."passwordHash",
    "role" = EXCLUDED."role",
    "status" = EXCLUDED."status",
    "updatedAt" = now();
