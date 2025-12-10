import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaFormulaBody } from "@/lib/api/validators";

export async function GET() {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const formulas = await prisma.pmaFormula.findMany({
    include: {
      capsuleFormula: true,
      bitumenOrigin: true,
      bitumenTest: true,
      batches: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(formulas);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = pmaFormulaBody.parse(await req.json());

    if (data.bitumenTestId) {
      const baseTest = await prisma.bitumenBaseTest.findUnique({
        where: { id: data.bitumenTestId },
      });
      if (!baseTest) {
        return NextResponse.json({ error: "Bitumen base test not found" }, { status: 400 });
      }
      if (
        data.targetPgHigh !== undefined &&
        baseTest.basePgHigh !== null &&
        baseTest.basePgHigh !== undefined &&
        data.targetPgHigh < baseTest.basePgHigh
      ) {
        return NextResponse.json(
          { error: "Target PG high must be >= base PG high" },
          { status: 400 },
        );
      }
      if (
        data.targetPgLow !== undefined &&
        baseTest.basePgLow !== null &&
        baseTest.basePgLow !== undefined &&
        data.targetPgLow < baseTest.basePgLow
      ) {
        return NextResponse.json(
          { error: "Target PG low must be >= base PG low" },
          { status: 400 },
        );
      }
    }

    const created = await prisma.pmaFormula.create({
      data: {
        name: data.name,
        capsuleFormulaId: data.capsuleFormulaId,
        bitumenOriginId: data.bitumenOriginId,
        bitumenTestId: data.bitumenTestId ?? null,
        ecoCapPercentage: data.ecoCapPercentage,
        reagentPercentage: data.reagentPercentage,
        mixRpm: data.mixRpm,
        mixTimeMinutes: data.mixTimeMinutes,
        pmaTargetPgHigh: data.targetPgHigh,
        pmaTargetPgLow: data.targetPgLow,
        bitumenGradeOverride: data.bitumenGradeOverride,
        notes: data.notes,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/pma", error);
    const message = error instanceof Error ? error.message : "Unable to create PMA formula";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
