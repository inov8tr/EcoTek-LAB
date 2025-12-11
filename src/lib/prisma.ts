import { PrismaClient } from "@prisma/client";

export const prisma =
  (globalThis as typeof globalThis & { __prismaClient?: PrismaClient }).__prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  (globalThis as typeof globalThis & { __prismaClient?: PrismaClient }).__prismaClient = prisma;
}
