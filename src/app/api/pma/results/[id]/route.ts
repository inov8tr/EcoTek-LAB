import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  console.warn(`PMA test result requested (${id}) but PMA test models are removed.`);
  return NextResponse.json(
    { error: "PMA test results are not available in this build." },
    { status: 410 },
  );
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  console.warn(`PMA test result update attempted (${id}) but PMA test models are removed.`);
  return NextResponse.json(
    { error: "PMA test results are not available in this build." },
    { status: 410 },
  );
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN], requireActive: true });
  if ("response" in authResult) return authResult.response;
  console.warn(`PMA test result delete attempted (${id}) but PMA test models are removed.`);
  return NextResponse.json(
    { error: "PMA test results are not available in this build." },
    { status: 410 },
  );
}
