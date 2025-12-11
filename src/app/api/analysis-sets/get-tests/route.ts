import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB", "VIEWER"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{ setId: string }>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const { setId } = body;

  if (!setId) {
    return NextResponse.json({ error: "Missing setId" }, { status: 400 });
  }

  const set = await prisma.analysisSet.findFirst({
    where: { id: setId, ownerId: user?.id },
    include: { tests: true },
  });

  const testIds = set?.tests?.map((t) => t.testResultId) ?? [];

  return NextResponse.json({ data: testIds });
}
