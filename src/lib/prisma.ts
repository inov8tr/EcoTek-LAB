import { PrismaClient } from "@prisma/client";

function withConnectionLimits(url?: string | null) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    // Only add if not already present
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const datasourceUrl = withConnectionLimits(process.env.DATABASE_URL);

export const prisma =
  (globalThis as typeof globalThis & { __prismaClient?: PrismaClient }).__prismaClient ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  (globalThis as typeof globalThis & { __prismaClient?: PrismaClient }).__prismaClient = prisma;
}
