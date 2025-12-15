import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { dbApi } from "@/lib/dbApi";

const createSchema = z.object({
  pmaTestBatchId: z.string().uuid(),
  testName: z.string().trim().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const tests = await dbApi("/db/binder-tests");
    return NextResponse.json(tests);
  } catch (error) {
    console.error("GET /api/binder-tests", error);
    return NextResponse.json({ error: "Failed to load binder tests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const body = createSchema.parse(await req.json());
    const res = await dbApi("/db/binder-tests", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(res, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/binder-tests", error);
    const message = error instanceof Error ? error.message : "Failed to create binder test";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
