import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

const PY_SERVICE_URL = process.env.PY_SERVICE_URL;
const API_KEY = process.env.DB_API_KEY || process.env.X_API_KEY;

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  if (!PY_SERVICE_URL || !API_KEY) {
    return NextResponse.json(
      { error: "Confirm service not configured", status: 501 },
      { status: 501 },
    );
  }

  const res = await fetch(`${PY_SERVICE_URL}/binder-tests/${id}/confirm`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "x-user-id": user.id,
      "x-user-role": user.role,
    },
  });

  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    return NextResponse.json(
      isJson ? JSON.parse(text) : { error: "Confirm failed", status: res.status },
      { status: res.status },
    );
  }

  return isJson ? NextResponse.json(JSON.parse(text), { status: res.status }) : new NextResponse(text, { status: res.status });
}
