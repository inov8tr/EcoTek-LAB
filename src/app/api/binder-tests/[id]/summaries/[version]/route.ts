import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbApi } from "@/lib/dbApi";

type RouteParams = { params: Promise<{ id: string; version: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id, version } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  try {
    const summary = await dbApi(`/binder-tests/${id}/summaries/${version}`, {
      headers: { "x-user-id": user.id, "x-user-role": user.role },
    });
    return NextResponse.json(summary);
  } catch (error: any) {
    const message = error?.message || "Failed to load summary";
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 });
  }
}
