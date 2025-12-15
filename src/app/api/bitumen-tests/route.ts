import { NextResponse } from "next/server";
import { bitumenTestBody } from "@/lib/api/validators";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { dbQuery } from "@/lib/db-proxy";
import { randomUUID } from "crypto";

// Utility: enforce auth once
async function requireResearcher() {
  const auth = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in auth) return auth.response; // return error response
  return null;
}

// ----------------------------- GET -----------------------------
export async function GET(req: Request) {
  const authError = await requireResearcher();
  if (authError) return authError;

  const url = new URL(req.url);
  const originId = url.searchParams.get("originId");

  try {
    const tests = await dbQuery<{
      id: string;
      bitumenOriginId: string;
      batchCode: string;
      softeningPoint: number | null;
      penetration: number | null;
      viscosity135: number | null;
      viscosity165: number | null;
      basePgHigh: number | null;
      basePgLow: number | null;
      baseDuctility: number | null;
      baseRecovery: number | null;
      notes: string | null;
      testedAt: string | null;
      createdAt: string;
      updatedAt: string;
      bitumenOrigin: {
        id: string;
        refineryName: string;
        binderGrade: string | null;
      } | null;
    }>(
      [
        'SELECT',
        '  b."id", b."bitumenOriginId", b."batchCode", b."softeningPoint", b."penetration",',
        '  b."viscosity135", b."viscosity165", b."basePgHigh", b."basePgLow", b."baseDuctility", b."baseRecovery",',
        '  b."notes", b."testedAt", b."createdAt", b."updatedAt",',
        '  CASE WHEN bo."id" IS NOT NULL THEN json_build_object(',
        "    'id', bo.\"id\",",
        "    'refineryName', bo.\"refineryName\",",
        "    'binderGrade', bo.\"binderGrade\"",
        '  ) ELSE NULL END AS "bitumenOrigin"',
        'FROM "BitumenBaseTest" b',
        'LEFT JOIN "BitumenOrigin" bo ON bo."id" = b."bitumenOriginId"',
        originId ? 'WHERE b."bitumenOriginId" = $1' : "",
        'ORDER BY b."createdAt" DESC',
      ]
        .filter(Boolean)
        .join("\n"),
      originId ? [originId] : [],
    );

    return NextResponse.json(tests);
  } catch (err) {
    console.error("GET /api/bitumen-tests", err);
    return NextResponse.json(
      { error: "Failed to load bitumen tests" },
      { status: 500 }
    );
  }
}

// ----------------------------- POST -----------------------------
export async function POST(req: Request) {
  const authError = await requireResearcher();
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = bitumenTestBody.parse(body);

    const id = randomUUID();
    const [created] = await dbQuery<{
      id: string;
      bitumenOriginId: string;
      batchCode: string;
      softeningPoint: number | null;
      penetration: number | null;
      viscosity135: number | null;
      viscosity165: number | null;
      basePgHigh: number | null;
      basePgLow: number | null;
      baseDuctility: number | null;
      baseRecovery: number | null;
      notes: string | null;
      testedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      [
        'INSERT INTO "BitumenBaseTest" (',
        '  "id", "bitumenOriginId", "batchCode", "softeningPoint", "penetration", "viscosity135", "viscosity165",',
        '  "basePgHigh", "basePgLow", "baseDuctility", "baseRecovery", "notes", "testedAt", "createdAt", "updatedAt"',
        ') VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())',
        'RETURNING "id", "bitumenOriginId", "batchCode", "softeningPoint", "penetration", "viscosity135", "viscosity165",',
        '  "basePgHigh", "basePgLow", "baseDuctility", "baseRecovery", "notes", "testedAt", "createdAt", "updatedAt"',
      ].join("\n"),
      [
        id,
        data.bitumenOriginId,
        data.batchCode,
        data.softeningPoint ?? null,
        data.penetration ?? null,
        data.viscosity135 ?? null,
        data.viscosity165 ?? null,
        data.basePgHigh ?? null,
        data.basePgLow ?? null,
        data.baseDuctility ?? null,
        data.baseRecovery ?? null,
        data.notes ?? null,
        data.testedAt ?? null,
      ],
    );

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten() },
        { status: 400 }
      );
    }

    console.error("POST /api/bitumen-tests", err);
    return NextResponse.json(
      { error: "Failed to create bitumen test" },
      { status: 500 }
    );
  }
}
