import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaBatchBody } from "@/lib/api/validators";
import { dbQuery } from "@/lib/db-proxy";
import { randomUUID } from "crypto";
import { dbApi } from "@/lib/dbApi";

export async function GET(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const { searchParams } = new URL(req.url);
  const pmaId = searchParams.get("pmaFormulaId");

  const batches = await dbQuery<{
    id: string;
    pmaFormulaId: string;
    batchCode: string | null;
    sampleDate: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }>(
    [
      'SELECT "id", "pmaFormulaId", "batchCode", "sampleDate", "notes", "createdAt", "updatedAt"',
      'FROM "PmaBatch"',
      pmaId ? 'WHERE "pmaFormulaId" = $1' : "",
      'ORDER BY "createdAt" DESC',
    ]
      .filter(Boolean)
      .join(" "),
    pmaId ? [pmaId] : [],
  );

  return NextResponse.json(batches);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  try {
    const data = pmaBatchBody.parse(await req.json());
    const id = randomUUID();
    const res = await dbApi(
      "/db/query",
      {
        method: "POST",
        body: JSON.stringify({
          query: [
            'INSERT INTO "PmaBatch" ("id", "pmaFormulaId", "batchCode", "sampleDate", "notes", "testedById", "createdAt", "updatedAt")',
            "VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())",
            'RETURNING "id", "pmaFormulaId", "batchCode", "sampleDate", "notes", "testedById", "createdAt", "updatedAt"',
          ].join(" "),
          params: [id, data.pmaFormulaId, data.batchCode, data.sampleDate ?? null, data.notes ?? null, user.id],
        }),
      },
    );
    const created = (res as any).rows?.[0] ?? null;
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/pma/batches", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to create PMA batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
