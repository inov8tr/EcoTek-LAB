import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{
    name: string;
    description?: string | null;
    testResultIds?: Array<string | number>;
  }>(req);
  if (parseError) return parseError;
  if (!body) return NextResponse.json({ error: "Empty request body" }, { status: 400 });

  const { name, description, testResultIds } = body;
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const normalizedIds = (testResultIds ?? [])
    .map((id: string | number) => (typeof id === "string" ? Number(id) : id))
    .filter((id: number) => Number.isFinite(id));

  const set = await prisma.analysisSet.create({
    data: {
      name,
      description,
      ownerId: user?.id,
      tests: {
        create: normalizedIds.map((id: number) => ({
          testResultId: id,
        })),
      },
    },
  });

  return NextResponse.json({ data: set });
}
