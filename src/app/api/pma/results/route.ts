import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { pmaResultBody } from "@/lib/api/validators";

export async function GET(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("pmaBatchId");

  console.warn(`PMA test results list requested (${batchId ?? "all"}) but PMA test models are removed.`);
  return NextResponse.json(
    { error: "PMA test results are not available in this build." },
    { status: 410 },
  );
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({ roles: [UserRole.ADMIN, UserRole.RESEARCHER], requireActive: true });
  if ("response" in authResult) return authResult.response;

  try {
    const data = pmaResultBody.parse(await req.json());

    if (data.storageStabilityDifference !== undefined && (data.storageStabilityDifference < 0 || data.storageStabilityDifference > 100)) {
      return NextResponse.json({ error: "Storage stability must be 0-100%" }, { status: 400 });
    }
    if (data.softeningPoint !== undefined && (data.softeningPoint < 40 || data.softeningPoint > 120)) {
      return NextResponse.json({ error: "Softening point should be between 40 and 120°C" }, { status: 400 });
    }
    // PG consistency checks: require both if either provided, ensure ranges and high >= low
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
    // PG high validation with DSR RTFO
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
    // PG low validation with BBR/DSR PAV
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

    // storage stability rule already bounded 0-100 in schema
    return NextResponse.json(
      { error: "PMA test results are not available in this build." },
      { status: 410 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/pma/results", error);
    return NextResponse.json({ error: "Unable to create PMA test result" }, { status: 500 });
  }
}
