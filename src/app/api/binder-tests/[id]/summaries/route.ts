import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbApi } from "@/lib/dbApi";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  try {
    const summaries = await dbApi(`/binder-tests/${id}/summaries`, {
      headers: { "x-user-id": user.id, "x-user-role": user.role },
    });
    return NextResponse.json(summaries);
  } catch (error: any) {
    console.error(`GET /api/binder-tests/${id}/summaries`, error);
    const message = error?.message || "Failed to load summaries";
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  try {
    const body = await req.json().catch(() => ({}));
    const created = await dbApi(`/binder-tests/${id}/summaries`, {
      method: "POST",
      headers: { "x-user-id": user.id, "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error(`POST /api/binder-tests/${id}/summaries`, error);
    const message = error?.message || "Failed to create summary";
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 });
  }
}
