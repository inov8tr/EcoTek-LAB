import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbApi } from "@/lib/dbApi";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  const version = new URL(req.url).searchParams.get("version");
  if (!version) {
    return NextResponse.json({ error: "version is required" }, { status: 400 });
  }

  try {
    const decisions = await dbApi(`/binder-tests/${id}/peer-review-decisions?version=${encodeURIComponent(version)}`, {
      headers: { "x-user-id": user.id, "x-user-role": user.role },
    });
    return NextResponse.json(decisions);
  } catch (error: any) {
    const message = error?.message || "Failed to load peer review decisions";
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  try {
    const body = await req.json();
    const created = await dbApi(`/binder-tests/${id}/peer-review-decisions`, {
      method: "POST",
      headers: { "x-user-id": user.id, "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Failed to add peer review decision";
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 });
  }
}
