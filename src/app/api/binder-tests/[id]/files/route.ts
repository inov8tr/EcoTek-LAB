import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbQuery } from "@/lib/db-proxy";

const payloadSchema = z.object({
  url: z.string().url(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const body = payloadSchema.parse(await req.json());
    const label = body.fileName ?? body.url.split("/").pop() ?? "attachment";
    await dbQuery(
      [
        'INSERT INTO "BinderTestDataFile" ("id", "binderTestId", "fileUrl", "fileType", "label", "createdAt")',
        "VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())",
      ].join(" "),
      [id, body.url, body.mimeType ?? null, label],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`POST /api/binder-tests/${id}/files`, error);
    return NextResponse.json({ error: "Unable to record binder test file" }, { status: 500 });
  }
}
