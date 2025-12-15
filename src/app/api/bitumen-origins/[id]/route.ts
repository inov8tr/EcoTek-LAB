import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { bitumenOriginBody, uuidString } from "@/lib/api/validators";
import { dbQuery } from "@/lib/db-proxy";

const updateSchema = bitumenOriginBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const record = await fetchOrigin(id);
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
    const [updated] = await dbQuery(
      [
        'UPDATE "BitumenOrigin"',
        'SET "refineryName" = COALESCE($2, "refineryName"),',
        '    "binderGrade" = COALESCE($3, "binderGrade"),',
        '    "originCountry" = COALESCE($4, "originCountry"),',
        '    "description" = COALESCE($5, "description"),',
        '    "updatedAt" = NOW()',
        'WHERE "id" = $1',
        'RETURNING "id", "refineryName", "binderGrade", "originCountry", "description", "createdAt", "updatedAt"',
      ].join(" "),
      [id, body.refineryName ?? null, body.binderGrade ?? null, body.originCountry ?? null, body.description ?? null],
    );
    if (!updated) {
      return NextResponse.json({ error: "Bitumen origin not found" }, { status: 404 });
    }
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

  const linked = await dbQuery<{ count: string }>(
    'SELECT COUNT(*)::text as count FROM "BitumenBaseTest" WHERE "bitumenOriginId" = $1',
    [id],
  );
  const linkedCount = linked[0]?.count ? Number(linked[0].count) : 0;
  if (linkedCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete origin with linked base tests" },
      { status: 409 },
    );
  }

  try {
    await dbQuery('DELETE FROM "BitumenOrigin" WHERE "id" = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/bitumen-origins/${id}`, error);
    return NextResponse.json({ error: "Unable to delete bitumen origin" }, { status: 500 });
  }
}

async function fetchOrigin(id: string) {
  const [origin] = await dbQuery<{
    id: string;
    refineryName: string;
    binderGrade: string | null;
    originCountry: string | null;
    description: string | null;
  }>('SELECT "id", "refineryName", "binderGrade", "originCountry", "description" FROM "BitumenOrigin" WHERE "id" = $1 LIMIT 1', [
    id,
  ]);
  if (!origin) return null;

  const baseTests = await dbQuery<{
    id: string;
    batchCode: string | null;
    softeningPoint: number | null;
    basePgHigh: number | null;
    basePgLow: number | null;
    createdAt: string;
  }>(
    [
      'SELECT "id", "batchCode", "softeningPoint", "basePgHigh", "basePgLow", "createdAt"',
      'FROM "BitumenBaseTest"',
      'WHERE "bitumenOriginId" = $1',
      'ORDER BY "createdAt" DESC',
    ].join(" "),
    [id],
  );

  const pmaFormulas = await dbQuery<{ id: string; name: string | null; bitumenGradeOverride: string | null }>(
    'SELECT "id", "name", "bitumenGradeOverride" FROM "PmaFormula" WHERE "bitumenOriginId" = $1',
    [id],
  );

  return { ...origin, baseTests, pmaFormulas };
}
