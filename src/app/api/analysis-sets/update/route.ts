import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{
    setId: string;
    name?: string;
    description?: string | null;
  }>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const { setId, name, description } = body;
  if (!setId) return NextResponse.json({ error: "Missing setId" }, { status: 400 });

  const set = await prisma.analysisSet.findFirst({ where: { id: setId, ownerId: user?.id } });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.analysisSet.update({
    where: { id: setId },
    data: {
      name: name ?? set.name,
      description: description === undefined ? set.description : description,
    },
  });

  return NextResponse.json({ data: updated });
}
