import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { BINDER_BASE_PATH } from "@/lib/binder/storage";
import { runHybridExtractionForBinderTest } from "@/lib/binder/hybridExtraction";
import fs from "fs";
import type { BinderTestExtractedData } from "@/lib/binder/types";
import { Analytics } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = new URL(req.url).searchParams;
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const binderTest = await prisma.binderTest.findUnique({ where: { id } });
  if (!binderTest) return new NextResponse("Not found", { status: 404 });

  const folderPath = path.join(BINDER_BASE_PATH, binderTest.folderName);
  const extraction = await runHybridExtractionForBinderTest(folderPath);

  // Save parsed deterministic JSON
  const metadataDir = path.join(folderPath, "metadata");
  fs.mkdirSync(metadataDir, { recursive: true });
  fs.writeFileSync(
    path.join(metadataDir, "parsed_deterministic.json"),
    JSON.stringify(extraction.data, null, 2)
  );
  if (extraction.usedAi) {
    const aiDir = path.join(folderPath, "ai");
    fs.mkdirSync(aiDir, { recursive: true });
    fs.writeFileSync(path.join(aiDir, "ai_extraction.json"), JSON.stringify(extraction.data, null, 2));
  }

  await maybeEnrichWithPython(extraction.data);

  await prisma.binderTest.update({
    where: { id: binderTest.id },
    data: {
      pgHigh: extraction.data.pgHigh,
      pgLow: extraction.data.pgLow,
      softeningPointC: extraction.data.softeningPointC,
      viscosity155_cP: extraction.data.viscosity155_cP,
      ductilityCm: extraction.data.ductilityCm,
      recoveryPct: extraction.data.recoveryPct,
      jnr_3_2: extraction.data.jnr_3_2,
      dsrData: extraction.data.dsrData as Prisma.InputJsonValue,
      aiExtractedData: extraction.usedAi
        ? ({ data: extraction.data, sources: extraction.sources } as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
      status: "PENDING_REVIEW",
    },
  });

  return NextResponse.json({ success: true, usedAi: extraction.usedAi });
}

async function maybeEnrichWithPython(data: BinderTestExtractedData) {
  if (data.pgHigh && data.pgLow) return;
  if (!data.dsrData || Object.keys(data.dsrData).length === 0) return;

  const temps = Object.keys(data.dsrData)
    .map((key) => Number(key))
    .filter((val) => Number.isFinite(val))
    .sort((a, b) => a - b);
  if (!temps.length) return;

  const gValues: number[] = [];
  for (const temp of temps) {
    const key = String(temp);
    const value = data.dsrData?.[key];
    if (typeof value !== "number" || Number.isNaN(value)) {
      return;
    }
    gValues.push(value);
  }

  const rtfoValues = gValues.map((val) => val * 0.85);

  try {
    const response = await Analytics.computePgGrade({
      g_original: gValues[0],
      delta_original: temps[0],
      g_rtfo: rtfoValues[0],
      delta_rtfo: temps[0],
    });
    if (response && "pg_high" in response && response.pg_high && !data.pgHigh) {
      data.pgHigh = response.pg_high;
      if (data.pgLow !== null) {
        data.performanceGrade = `PG ${data.pgHigh}-${Math.abs(data.pgLow)}`;
      }
    }
  } catch (error) {
    console.error("Python service enrichment failed", error);
  }
}
