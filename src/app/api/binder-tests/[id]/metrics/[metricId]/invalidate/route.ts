import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbApi } from "@/lib/dbApi";

const payloadSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required"),
});

type RouteParams = { params: Promise<{ id: string; metricId: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id, metricId } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const body = payloadSchema.parse(await req.json());
    const result = await dbApi(`/db/binder-tests/${id}/metrics/${metricId}/invalidate`, {
      method: "POST",
      body: JSON.stringify({ reason: body.reason }),
      headers: { "Content-Type": "application/json" },
    });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`POST /api/binder-tests/${id}/metrics/${metricId}/invalidate`, error);
    const message = error?.message || "Failed to invalidate metric";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
