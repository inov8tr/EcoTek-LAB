import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbQuery } from "@/lib/db-proxy";

const payloadSchema = z.object({
  metricType: z.string().trim().min(1),
  metricName: z.string().trim().optional().nullable(),
  position: z.string().trim().optional().nullable(),
  value: z.number().optional().nullable(),
  units: z.string().trim().optional().nullable(),
  temperature: z.number().optional().nullable(),
  frequency: z.number().optional().nullable(),
  sourceFileId: z.string().trim().optional().nullable(),
  sourcePage: z.number().int().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const body = payloadSchema.parse(await req.json());
    const rows = await dbQuery(
      [
        'INSERT INTO "BinderTestMetric" (',
        '"id","binderTestId","parseRunId","metricType","metricName","position","value","units","temperature","frequency","sourceFileId","sourcePage","language","confidence","isUserConfirmed","createdAt","updatedAt"',
        ") VALUES (",
        "gen_random_uuid()::text, $1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL, true, NOW(), NOW()",
        ") RETURNING",
        '"id","binderTestId","parseRunId","metricType","metricName","position","value","units","temperature","frequency","sourceFileId","sourcePage","language","confidence","isUserConfirmed"',
      ].join(" "),
      [
        id,
        body.metricType,
        body.metricName ?? null,
        body.position ?? null,
        body.value ?? null,
        body.units ?? null,
        body.temperature ?? null,
        body.frequency ?? null,
        body.sourceFileId ?? null,
        body.sourcePage ?? null,
      ],
    );

    return NextResponse.json(rows?.[0] ?? null, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`POST /api/binder-tests/${id}/metrics/manual`, error);
    const message = error?.message || "Failed to add manual metric";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
