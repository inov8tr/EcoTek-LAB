import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaFormulaBody } from "@/lib/api/validators";
import { dbApi } from "@/lib/dbApi";
import { dbQuery } from "@/lib/db-proxy";
import { randomUUID } from "crypto";

export async function GET() {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const formulas = await dbApi("/db/pma-formulas");
    return NextResponse.json(formulas);
  } catch (error) {
    console.error("GET /api/pma", error);
    return NextResponse.json({ error: "Failed to load PMA formulas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = pmaFormulaBody.parse(await req.json());

    // validate bitumen test bounds (if provided)
    if (data.bitumenTestId) {
      const [baseTest] = await dbQuery<{
        basePgHigh: number | null;
        basePgLow: number | null;
      }>('SELECT "basePgHigh", "basePgLow" FROM "BitumenBaseTest" WHERE "id" = $1 LIMIT 1', [
        data.bitumenTestId,
      ]);
      if (!baseTest) {
        return NextResponse.json({ error: "Bitumen base test not found" }, { status: 400 });
      }
      if (
        data.targetPgHigh !== undefined &&
        baseTest.basePgHigh !== null &&
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
        data.targetPgLow < baseTest.basePgLow
      ) {
        return NextResponse.json(
          { error: "Target PG low must be >= base PG low" },
          { status: 400 },
        );
      }
    }

    const created = await dbApi("/db/pma-formulas", {
      method: "POST",
      body: JSON.stringify({
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
      }),
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
