import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{
    setId: string;
    testResultIds: Array<string | number>;
  }>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const { setId, testResultIds } = body;

  const normalizedIds = (testResultIds ?? [])
    .map((id: string | number) => (typeof id === "string" ? Number(id) : id))
    .filter((id: number) => Number.isFinite(id));

  if (!setId || !normalizedIds.length) {
    return NextResponse.json({ error: "Missing setId or testResultIds" }, { status: 400 });
  }

  await prisma.analysisSetTest.deleteMany({
    where: {
      analysisSetId: setId,
      testResultId: { in: normalizedIds },
    },
  });

  return NextResponse.json({ ok: true });
}
