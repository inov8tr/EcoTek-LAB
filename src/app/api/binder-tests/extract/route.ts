import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { BINDER_BASE_PATH } from "@/lib/binder/storage";
import { runHybridExtractionForBinderTest } from "@/lib/binder/hybridExtraction";
import fs from "fs";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params?: { id?: string } }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = new URL(req.url).searchParams;
  const id = params?.id ?? searchParams.get("id");
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
      dsrData: extraction.data.dsrData,
      aiExtractedData: extraction.usedAi ? { data: extraction.data, sources: extraction.sources } : null,
      status: "PENDING_REVIEW",
    },
  });

  return NextResponse.json({ success: true, usedAi: extraction.usedAi });
}
