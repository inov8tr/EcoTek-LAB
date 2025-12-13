import type { NextRequest } from "next/server";
import { dbQuery } from "@/lib/db-proxy";

type LogOptions = {
  req: NextRequest;
  userId?: string | null;
  action: string;
  status: number;
  category?: string | null;
  sampleRate?: number;
};

const DEFAULT_SAMPLE = 0.1;

function shouldLog(sampleRate?: number) {
  const rateEnv = process.env.REQUEST_LOG_SAMPLE;
  const rate = sampleRate ?? (rateEnv ? Number(rateEnv) : DEFAULT_SAMPLE);
  if (Number.isNaN(rate) || rate <= 0) return false;
  if (rate >= 1) return true;
  return Math.random() < rate;
}

function getRequestMeta(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")?.[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ip, userAgent, path: req.nextUrl.pathname, method: req.method };
}

export async function logApiRequest(opts: LogOptions) {
  if (!shouldLog(opts.sampleRate)) return;
  if (!opts.userId) return;
  const meta = getRequestMeta(opts.req);
  await dbQuery(
    'INSERT INTO "SecurityEvent" ("userId", "eventType", "detail", "ipAddress", "userAgent", "category", "channel") VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      opts.userId,
      "API_REQUEST",
      `${meta.method} ${meta.path} -> ${opts.status} (${opts.action})`,
      meta.ip,
      meta.userAgent,
      opts.category ?? "api",
      "audit",
    ],
  );
}
