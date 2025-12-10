import fs from "fs";
import path from "path";
import mime from "mime-types";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { runHybridExtractionForBinderTest } from "@/lib/binder/hybridExtraction";
import { BINDER_BASE_PATH, ensureBinderFolders, sanitizeTestName, saveBinderTestFile } from "@/lib/binder/storage";
import { captureClientMetadata } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const binderTest = await prisma.binderTest.findUnique({ where: { id } });
  if (!binderTest || !binderTest.folderName) {
    return new NextResponse("Binder test not found", { status: 404 });
  }

  const formData = await req.formData();
  const pdfFile = formData.get("pdfReport") as File | null;
  const photos = (formData.getAll("photos") as File[]).filter(Boolean);
  const videos = (formData.getAll("videos") as File[]).filter(Boolean);
  const parsePdf = formData.get("parsePdf") === "on";

  if ((!pdfFile || pdfFile.size === 0) && photos.length === 0 && videos.length === 0) {
    return new NextResponse("At least one file is required.", { status: 400 });
  }

  const folderName = binderTest.folderName || `${binderTest.id}-${sanitizeTestName(binderTest.name ?? "binder-test")}`;
  ensureBinderFolders(folderName);

  const fileMeta: { pdf?: string | null; photos: string[]; videos: string[] } = {
    pdf: null,
    photos: [],
    videos: [],
  };

  if (pdfFile && pdfFile.size > 0) {
    const saved = await saveBinderTestFile(folderName, pdfFile, `report-${Date.now()}.pdf`);
    fileMeta.pdf = saved;
  }

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    if (!file || file.size === 0) continue;
    const saved = await saveBinderTestFile(folderName, file, `photo-${Date.now()}-${i + 1}${path.extname(file.name) || ".jpg"}`);
    fileMeta.photos.push(saved);
  }

  for (let i = 0; i < videos.length; i++) {
    const file = videos[i];
    if (!file || file.size === 0) continue;
    const saved = await saveBinderTestFile(folderName, file, `video-${Date.now()}-${i + 1}${path.extname(file.name) || ".mp4"}`);
    fileMeta.videos.push(saved);
  }

  const docsData = [
    ...(fileMeta.pdf
      ? [
          {
            originalName: pdfFile?.name ?? "report.pdf",
            storedPath: fileMeta.pdf,
            mimeType: pdfFile?.type ?? (mime.lookup(fileMeta.pdf) || null),
            sizeBytes: pdfFile?.size ?? null,
          },
        ]
      : []),
    ...fileMeta.photos.map((p, idx) => ({
      originalName: photos[idx]?.name ?? `photo-${idx + 1}`,
      storedPath: p,
      mimeType: photos[idx]?.type ?? (mime.lookup(p) || null),
      sizeBytes: photos[idx]?.size ?? null,
    })),
    ...fileMeta.videos.map((p, idx) => ({
      originalName: videos[idx]?.name ?? `video-${idx + 1}`,
      storedPath: p,
      mimeType: videos[idx]?.type ?? (mime.lookup(p) || null),
      sizeBytes: videos[idx]?.size ?? null,
    })),
  ];

  if (docsData.length) {
    await prisma.binderTestDocument.createMany({
      data: docsData.map((d) => ({
        binderTestId: binderTest.id,
        originalName: d.originalName,
        storedPath: d.storedPath,
        mimeType: typeof d.mimeType === "string" ? d.mimeType : null,
        sizeBytes: d.sizeBytes ?? undefined,
      })),
    });
  }

  let extraction:
    | {
        data: Record<string, any>;
        usedAi: boolean;
        sources: any;
      }
    | null = null;

  if (parsePdf && fileMeta.pdf) {
    const folderPath = path.join(BINDER_BASE_PATH, folderName);
    try {
      extraction = await runHybridExtractionForBinderTest(folderPath);

      const metadataDir = path.join(folderPath, "metadata");
      fs.mkdirSync(metadataDir, { recursive: true });
      fs.writeFileSync(path.join(metadataDir, "parsed_deterministic.json"), JSON.stringify(extraction.data, null, 2));
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
          dsrData: extraction.data.dsrData as Prisma.InputJsonValue,
          aiExtractedData: extraction.usedAi
            ? ({ data: extraction.data, sources: extraction.sources } as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          status: "PENDING_REVIEW",
        },
      });
    } catch (parseErr) {
      console.error("PDF re-parse failed", parseErr);
      await prisma.binderTest.update({
        where: { id: binderTest.id },
        data: { status: "PENDING_REVIEW" },
      });
    }
  }

  const meta = await captureClientMetadata();
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: "BINDER_TEST_DOC_ADDED",
      detail: `Additional documents added to binder test ${binderTest.id}`,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });
  if (parsePdf && fileMeta.pdf) {
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "BINDER_TEST_REPARSE",
        detail: `Re-parse requested for binder test ${binderTest.id}`,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
  }

  return NextResponse.json({ id: binderTest.id, parsed: !!extraction });
}
