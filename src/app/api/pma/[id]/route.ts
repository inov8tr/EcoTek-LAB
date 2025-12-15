import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaFormulaBody, uuidString } from "@/lib/api/validators";
import { dbApi } from "@/lib/dbApi";
import { dbQuery } from "@/lib/db-proxy";

const updateSchema = pmaFormulaBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const formula = await fetchPma(id);
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

    // Optional guard using base test bounds (via dbQuery proxy)
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

    const updated = await dbApi(`/db/pma-formulas/${id}`, {
      method: "PATCH",
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

  const linked = await dbQuery<{ count: string }>(
    'SELECT COUNT(*)::text as count FROM "PmaBatch" WHERE "pmaFormulaId" = $1',
    [id],
  );
  const linkedCount = linked[0]?.count ? Number(linked[0].count) : 0;
  if (linkedCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete PMA formula with linked batches" },
      { status: 409 },
    );
  }

  try {
    await dbApi(`/db/pma-formulas/${id}`, { method: "DELETE" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/pma/${id}`, error);
    return NextResponse.json({ error: "Unable to delete PMA formula" }, { status: 500 });
  }
}

async function fetchPma(id: string) {
  const baseUrl = process.env.DB_API_URL;
  const apiKey = process.env.DB_API_KEY || process.env.X_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("DB_API_URL/DB_API_KEY must be configured");
  }

  const res = await fetch(`${baseUrl}/db/pma-formulas/${id}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`DB API error ${res.status}`);
  }
  return res.json();
}
