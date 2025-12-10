import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

const capsuleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET() {
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;

  const formulas = await prisma.capsuleFormula.findMany({
    include: {
      pmaFormulas: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(formulas);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  try {
    const data = capsuleSchema.parse(await req.json());

    const creator = user?.id
      ? await prisma.user.findUnique({ where: { id: user.id } })
      : null;

    const created = await prisma.capsuleFormula.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        createdById: creator?.id ?? null,
      },
      include: { pmaFormulas: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/capsules", error);
    return NextResponse.json({ error: "Unable to create capsule formula" }, { status: 500 });
  }
}
