import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import mime from "mime-types";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { runHybridExtractionForBinderTest } from "@/lib/binder/hybridExtraction";
import { BINDER_BASE_PATH, sanitizeTestName, ensureBinderFolders, saveBinderTestFile } from "@/lib/binder/storage";
import { captureClientMetadata } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();

  const testName = String(formData.get("name") ?? "").trim();
  if (!testName) {
    return new NextResponse("Missing name", { status: 400 });
  }

  const payload = {
    testName,
    pmaFormulaId: formData.get("pmaFormulaId")?.toString() || null,
    batchId: formData.get("batchId")?.toString() || null,
    binderSource: formData.get("binderSource")?.toString() || null,
    operator: formData.get("operator")?.toString() || null,
    lab: formData.get("lab")?.toString() || null,
    crmPct: parseFloatOrNull(formData.get("crmPct")),
    reagentPct: parseFloatOrNull(formData.get("reagentPct")),
    aerosilPct: parseFloatOrNull(formData.get("aerosilPct")),
    notes: formData.get("notes")?.toString() || null,
  };

  const pdfFile = formData.get("pdfReport") as File | null;
  const photos = (formData.getAll("photos") as File[]).filter(Boolean);
  const videos = (formData.getAll("videos") as File[]).filter(Boolean);
  const parsePdf = formData.get("parsePdf") === "on";

  try {
    if (!pdfFile || pdfFile.size === 0) {
      return new NextResponse("PDF report is required.", { status: 400 });
    }

    const binderTest = await prisma.binderTest.create({
      data: {
        ...payload,
        folderName: "tmp",
        originalFiles: { pdf: null, photos: [], videos: [] },
      },
    });

    const folderName = `${binderTest.id}-${sanitizeTestName(testName) || "binder-test"}`;
    ensureBinderFolders(folderName);

    const fileMeta: { pdf?: string | null; photos: string[]; videos: string[] } = {
      pdf: null,
      photos: [],
      videos: [],
    };

    if (pdfFile && pdfFile.size > 0) {
      const saved = await saveBinderTestFile(folderName, pdfFile, "report.pdf");
      fileMeta.pdf = saved;
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      if (!file || file.size === 0) continue;
      const saved = await saveBinderTestFile(folderName, file, `photo-${i + 1}${path.extname(file.name) || ".jpg"}`);
      fileMeta.photos.push(saved);
    }

    for (let i = 0; i < videos.length; i++) {
      const file = videos[i];
      if (!file || file.size === 0) continue;
      const saved = await saveBinderTestFile(folderName, file, `video-${i + 1}${path.extname(file.name) || ".mp4"}`);
      fileMeta.videos.push(saved);
    }

    await prisma.binderTest.update({
      where: { id: binderTest.id },
      data: { folderName, originalFiles: fileMeta },
    });

    // Catalog documents in DB
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

    if (parsePdf) {
      try {
        const folderPath = path.join(BINDER_BASE_PATH, folderName);
        extraction = await runHybridExtractionForBinderTest(folderPath);

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
            dsrData: extraction.data.dsrData as Prisma.InputJsonValue,
            aiExtractedData: extraction.usedAi
              ? ({ data: extraction.data, sources: extraction.sources } as unknown as Prisma.InputJsonValue)
              : Prisma.DbNull,
            status: "PENDING_REVIEW",
          },
        });
      } catch (parseErr) {
        console.error("PDF parse failed", parseErr);
        // Keep submission but mark status pending review, let user fix manually
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
        eventType: "BINDER_TEST_SUBMITTED",
        detail: `Binder test submitted: ${testName}`,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "BINDER_TEST_VERIFY_REQUEST",
        detail: `Verification requested for binder test ${binderTest.id}`,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return NextResponse.json({ id: binderTest.id, folderName });
  } catch (err) {
    console.error("Failed to create binder test", err);
    const message = err instanceof Error ? err.message : "Failed to create binder test";
    return new NextResponse(message, { status: 500 });
  }
}

function parseFloatOrNull(val: FormDataEntryValue | null): number | null {
  if (!val) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}
