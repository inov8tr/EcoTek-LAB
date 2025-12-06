import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { bitumenOriginBody, uuidString } from "@/lib/api/validators";

const updateSchema = bitumenOriginBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const record = await prisma.bitumenOrigin.findUnique({
    where: { id },
    include: { baseTests: true, pmaFormulas: true },
  });
  if (!record) {
    return NextResponse.json({ error: "Bitumen origin not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const body = updateSchema.parse(await req.json());
    const updated = await prisma.bitumenOrigin.update({
      where: { id },
      data: {
        refineryName: body.refineryName ?? undefined,
        binderGrade: body.binderGrade ?? undefined,
        originCountry: body.originCountry ?? undefined,
        description: body.description ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`PATCH /api/bitumen-origins/${id}`, error);
    return NextResponse.json({ error: "Unable to update bitumen origin" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const linked = await prisma.bitumenBaseTest.count({ where: { bitumenOriginId: id } });
  if (linked > 0) {
    return NextResponse.json(
      { error: "Cannot delete origin with linked base tests" },
      { status: 409 },
    );
  }

  try {
    await prisma.bitumenOrigin.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/bitumen-origins/${id}`, error);
    return NextResponse.json({ error: "Unable to delete bitumen origin" }, { status: 500 });
  }
}
