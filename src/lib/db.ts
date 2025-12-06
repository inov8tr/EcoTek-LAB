import { Pool } from "pg";

declare global {
  var __ecotekPool: Pool | undefined;
}

let pool: Pool | null = null;

export function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) return null;
  if (!global.__ecotekPool) {
    global.__ecotekPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 10_000,
    });
  }
  pool = global.__ecotekPool;
  return pool;
}

export async function getDatabaseStatus() {
  const clientPool = getPool();
  if (!clientPool) {
    return {
      connected: false,
      message: "Set DATABASE_URL to enable live PostgreSQL telemetry.",
    };
  }

  try {
    await clientPool.query("SELECT 1");
    return { connected: true, message: "Live connection" };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
