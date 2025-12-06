import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaBatchBody, uuidString } from "@/lib/api/validators";

const updateSchema = pmaBatchBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const batch = await prisma.pmaBatch.findUnique({
    where: { id },
    include: { testResults: true, pmaFormula: true },
  });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  return NextResponse.json(batch);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = updateSchema.parse(await req.json());
    const updated = await prisma.pmaBatch.update({
      where: { id },
      data: {
        pmaFormulaId: data.pmaFormulaId ?? undefined,
        batchCode: data.batchCode ?? undefined,
        sampleDate: data.sampleDate ? new Date(data.sampleDate) : undefined,
        notes: data.notes ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`PATCH /api/pma/batches/${id}`, error);
    return NextResponse.json({ error: "Unable to update batch" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const linked = await prisma.pmaTestResult.count({ where: { pmaBatchId: id } });
  if (linked > 0) {
    return NextResponse.json(
      { error: "Cannot delete batch with linked test results" },
      { status: 409 },
    );
  }

  try {
    await prisma.pmaBatch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/pma/batches/${id}`, error);
    return NextResponse.json({ error: "Unable to delete batch" }, { status: 500 });
  }
}
