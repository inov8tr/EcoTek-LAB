import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{ sessionId: string }>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await prisma.analysisSession.findFirst({
    where: { id: sessionId, ownerId: user?.id },
    include: {
      analysisSet: {
        include: {
          tests: true,
        },
      },
    },
  });

  return NextResponse.json({ data: session });
}
