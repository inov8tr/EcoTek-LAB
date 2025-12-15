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
  const suffix = version ? `?version=${encodeURIComponent(version)}` : "";

  try {
    const comments = await dbApi(`/binder-tests/${id}/peer-comments${suffix}`, {
      headers: { "x-user-id": user.id, "x-user-role": user.role },
    });
    return NextResponse.json(comments);
  } catch (error: any) {
    const message = error?.message || "Failed to load peer comments";
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
    const created = await dbApi(`/binder-tests/${id}/peer-comments`, {
      method: "POST",
      headers: { "x-user-id": user.id, "x-user-role": user.role },
      body: JSON.stringify(body),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Failed to add peer comment";
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 });
  }
}
