import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<Record<string, any>>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const session = await prisma.analysisSession.create({
    data: {
      ...(body as any),
      ownerId: user?.id ?? (body as any).ownerId ?? null,
    },
  });

  return NextResponse.json({ data: session });
}
