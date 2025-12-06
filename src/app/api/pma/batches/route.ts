import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaBatchBody } from "@/lib/api/validators";

export async function GET(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const { searchParams } = new URL(req.url);
  const pmaId = searchParams.get("pmaFormulaId");

  const batches = await prisma.pmaBatch.findMany({
    where: pmaId ? { pmaFormulaId: pmaId } : undefined,
    include: { testResults: true, pmaFormula: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(batches);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  try {
    const data = pmaBatchBody.parse(await req.json());
    const created = await prisma.pmaBatch.create({
      data: {
        pmaFormulaId: data.pmaFormulaId,
        batchCode: data.batchCode,
        sampleDate: data.sampleDate ? new Date(data.sampleDate) : null,
        notes: data.notes ?? null,
        testedById: user.id,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/pma/batches", error);
    return NextResponse.json({ error: "Unable to create PMA batch" }, { status: 500 });
  }
}
