import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { bitumenOriginBody } from "@/lib/api/validators";
import { z } from "zod";
import { dbQuery } from "@/lib/db-proxy";
import { randomUUID } from "crypto";

export async function GET() {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const origins = await dbQuery<{
    id: string;
    refineryName: string;
    binderGrade: string | null;
    originCountry: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    baseTestsCount: number | null;
  }>(
    [
      'SELECT bo."id", bo."refineryName", bo."binderGrade", bo."originCountry", bo."description", bo."createdAt", bo."updatedAt",',
      '  (SELECT COUNT(*) FROM "BitumenBaseTest" b WHERE b."bitumenOriginId" = bo."id") AS "baseTestsCount"',
      'FROM "BitumenOrigin" bo',
      'ORDER BY bo."createdAt" DESC',
    ].join(" "),
  );
  return NextResponse.json(origins);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = bitumenOriginBody.parse(await req.json());
    const id = randomUUID();
    const [created] = await dbQuery<{
      id: string;
      refineryName: string;
      binderGrade: string | null;
      originCountry: string | null;
      description: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      [
        'INSERT INTO "BitumenOrigin" ("id", "refineryName", "binderGrade", "originCountry", "description", "createdAt", "updatedAt")',
        "VALUES ($1, $2, $3, $4, $5, NOW(), NOW())",
        'RETURNING "id", "refineryName", "binderGrade", "originCountry", "description", "createdAt", "updatedAt"',
      ].join(" "),
      [id, data.refineryName, data.binderGrade, data.originCountry ?? "", data.description ?? ""],
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/bitumen-origins", error);
    return NextResponse.json({ error: "Unable to create bitumen origin" }, { status: 500 });
  }
}
