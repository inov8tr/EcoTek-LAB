import { NextResponse } from "next/server";
import { guardRequest } from "@/lib/api/guard";

// Minimal badge endpoint to satisfy UI polling for unread messages.
export async function GET() {
  const { errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB", "VIEWER"] });
  if (errorResponse) return errorResponse;

  return NextResponse.json({ count: 0 });
}
