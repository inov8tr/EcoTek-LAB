import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaResultBody, uuidString } from "@/lib/api/validators";

const updateSchema = pmaResultBody.partial().extend({ id: uuidString.optional() });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const result = await prisma.pmaTestResult.findUnique({
    where: { id },
    include: { pmaBatch: true },
  });
  if (!result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = updateSchema.parse(await req.json());
    if (
      data.storageStabilityDifference !== undefined &&
      (data.storageStabilityDifference < 0 || data.storageStabilityDifference > 100)
    ) {
      return NextResponse.json({ error: "Storage stability must be 0-100%" }, { status: 400 });
    }
    if (
      data.softeningPoint !== undefined &&
      (data.softeningPoint < 40 || data.softeningPoint > 120)
    ) {
      return NextResponse.json(
        { error: "Softening point should be between 40 and 120°C" },
        { status: 400 },
      );
    }
    if ((data.pgHigh !== undefined && data.pgLow === undefined) || (data.pgLow !== undefined && data.pgHigh === undefined)) {
      return NextResponse.json({ error: "Provide both PG high and PG low together" }, { status: 400 });
    }
    if (data.pgHigh !== undefined && (data.pgHigh < 40 || data.pgHigh > 120)) {
      return NextResponse.json({ error: "PG high should be between 40 and 120" }, { status: 400 });
    }
    if (data.pgLow !== undefined && (data.pgLow < -40 || data.pgLow > 0)) {
      return NextResponse.json({ error: "PG low should be between -40 and 0" }, { status: 400 });
    }
    if (data.pgHigh !== undefined && data.pgLow !== undefined && data.pgHigh < data.pgLow) {
      return NextResponse.json({ error: "PG high must be >= PG low" }, { status: 400 });
    }
    if (
      data.pgHigh !== undefined &&
      data.dsrRtfoGOverSin !== undefined &&
      data.dsrRtfoGOverSin < 2.2
    ) {
      return NextResponse.json(
        { error: "PG high invalid: DSR RTFO G*/sinδ < 2.2 kPa" },
        { status: 400 },
      );
    }
    if (
      data.pgLow !== undefined &&
      ((data.bbrStiffness !== undefined && data.bbrStiffness > 300) ||
        (data.bbrMValue !== undefined && data.bbrMValue < 0.3) ||
        (data.dsrPavGTimesSin !== undefined && data.dsrPavGTimesSin > 5000))
    ) {
      return NextResponse.json(
        { error: "PG low invalid: BBR/DSR PAV criteria not met" },
        { status: 400 },
      );
    }
    const updated = await prisma.pmaTestResult.update({
      where: { id },
      data: {
        pmaBatchId: data.pmaBatchId ?? undefined,
        softeningPoint: data.softeningPoint ?? undefined,
        viscosity135: data.viscosity135 ?? undefined,
        viscosity165: data.viscosity165 ?? undefined,
        ductility: data.ductility ?? undefined,
        elasticRecovery: data.elasticRecovery ?? undefined,
        storageStabilityDifference: data.storageStabilityDifference ?? undefined,
        pgHigh: data.pgHigh ?? undefined,
        pgLow: data.pgLow ?? undefined,
        dsrOriginalTemp: data.dsrOriginalTemp ?? undefined,
        dsrOriginalGOverSin: data.dsrOriginalGOverSin ?? undefined,
        dsrRtfoTemp: data.dsrRtfoTemp ?? undefined,
        dsrRtfoGOverSin: data.dsrRtfoGOverSin ?? undefined,
        dsrPavTemp: data.dsrPavTemp ?? undefined,
        dsrPavGTimesSin: data.dsrPavGTimesSin ?? undefined,
        bbrTemp: data.bbrTemp ?? undefined,
        bbrStiffness: data.bbrStiffness ?? undefined,
        bbrMValue: data.bbrMValue ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`PATCH /api/pma/results/${id}`, error);
    return NextResponse.json({ error: "Unable to update PMA result" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    await prisma.pmaTestResult.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/pma/results/${id}`, error);
    return NextResponse.json({ error: "Unable to delete PMA result" }, { status: 500 });
  }
}
