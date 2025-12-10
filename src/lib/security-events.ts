import { headers } from "next/headers";

export async function captureClientMetadata() {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = hdrs.get("user-agent") ?? null;
  return { ip, userAgent };
}
