import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { bitumenTestBody, uuidString } from "@/lib/api/validators";

const updateSchema = bitumenTestBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const record = await prisma.bitumenBaseTest.findUnique({
    where: { id },
    include: { bitumenOrigin: true },
  });
  if (!record) {
    return NextResponse.json({ error: "Bitumen test not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.bitumenBaseTest.update({
      where: { id },
      data: {
        bitumenOriginId: data.bitumenOriginId ?? undefined,
        batchCode: data.batchCode ?? undefined,
        softeningPoint: data.softeningPoint,
        penetration: data.penetration,
        viscosity135: data.viscosity135,
        viscosity165: data.viscosity165,
        basePgHigh: data.basePgHigh,
        basePgLow: data.basePgLow,
        baseDuctility: data.baseDuctility,
        baseRecovery: data.baseRecovery,
        notes: data.notes ?? undefined,
        testedAt: data.testedAt ? new Date(data.testedAt) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`PATCH /api/bitumen-tests/${id}`, error);
    return NextResponse.json({ error: "Unable to update bitumen test" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const linked = await prisma.pmaFormula.count({ where: { bitumenTestId: id } });
  if (linked > 0) {
    return NextResponse.json(
      { error: "Cannot delete test with linked PMA formulas" },
      { status: 409 },
    );
  }

  try {
    await prisma.bitumenBaseTest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/bitumen-tests/${id}`, error);
    return NextResponse.json({ error: "Unable to delete bitumen test" }, { status: 500 });
  }
}
