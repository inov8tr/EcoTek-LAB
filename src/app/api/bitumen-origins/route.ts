import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { bitumenOriginBody } from "@/lib/api/validators";
import { z } from "zod";

export async function GET() {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const origins = await prisma.bitumenOrigin.findMany({
    orderBy: { createdAt: "desc" },
    include: { baseTests: true },
  });
  return NextResponse.json(origins);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = bitumenOriginBody.parse(await req.json());
    const created = await prisma.bitumenOrigin.create({
      data: {
        refineryName: data.refineryName,
        binderGrade: data.binderGrade,
        originCountry: data.originCountry ?? "",
        description: data.description ?? "",
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/bitumen-origins", error);
    return NextResponse.json({ error: "Unable to create bitumen origin" }, { status: 500 });
  }
}
