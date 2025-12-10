import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaFormulaBody, uuidString } from "@/lib/api/validators";

const updateSchema = pmaFormulaBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const formula = await prisma.pmaFormula.findUnique({
    where: { id },
    include: {
      capsuleFormula: true,
      bitumenOrigin: true,
      bitumenTest: true,
      batches: true,
    },
  });

  if (!formula) {
    return NextResponse.json({ error: "PMA formula not found" }, { status: 404 });
  }

  return NextResponse.json(formula);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = updateSchema.parse(await req.json());
    const existing = await prisma.pmaFormula.findUnique({
      where: { id },
      include: { bitumenTest: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "PMA formula not found" }, { status: 404 });
    }

    const bitumenTestId =
      data.bitumenTestId === undefined ? existing.bitumenTestId : data.bitumenTestId;
    if (bitumenTestId) {
      const baseTest = await prisma.bitumenBaseTest.findUnique({ where: { id: bitumenTestId } });
      if (!baseTest) {
        return NextResponse.json({ error: "Bitumen base test not found" }, { status: 400 });
      }

      const targetPgHigh = data.targetPgHigh ?? existing.pmaTargetPgHigh;
      const targetPgLow = data.targetPgLow ?? existing.pmaTargetPgLow;
      if (targetPgHigh !== null && targetPgHigh !== undefined && baseTest.basePgHigh != null && targetPgHigh < baseTest.basePgHigh) {
        return NextResponse.json(
          { error: "Target PG high must be >= base PG high" },
          { status: 400 },
        );
      }
      if (targetPgLow !== null && targetPgLow !== undefined && baseTest.basePgLow != null && targetPgLow < baseTest.basePgLow) {
        return NextResponse.json(
          { error: "Target PG low must be >= base PG low" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.pmaFormula.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        capsuleFormulaId: data.capsuleFormulaId ?? undefined,
        bitumenOriginId: data.bitumenOriginId ?? undefined,
        bitumenTestId: data.bitumenTestId === undefined ? undefined : data.bitumenTestId,
        ecoCapPercentage: data.ecoCapPercentage ?? undefined,
        reagentPercentage: data.reagentPercentage ?? undefined,
        mixRpm: data.mixRpm ?? undefined,
        mixTimeMinutes: data.mixTimeMinutes ?? undefined,
        pmaTargetPgHigh: data.targetPgHigh ?? undefined,
        pmaTargetPgLow: data.targetPgLow ?? undefined,
        bitumenGradeOverride: data.bitumenGradeOverride ?? undefined,
        notes: data.notes ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`PATCH /api/pma/${id}`, error);
    const message = error instanceof Error ? error.message : "Unable to update PMA formula";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const linked = await prisma.pmaBatch.count({ where: { pmaFormulaId: id } });
  if (linked > 0) {
    return NextResponse.json(
      { error: "Cannot delete PMA formula with linked batches" },
      { status: 409 },
    );
  }

  try {
    await prisma.pmaFormula.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/pma/${id}`, error);
    return NextResponse.json({ error: "Unable to delete PMA formula" }, { status: 500 });
  }
}
