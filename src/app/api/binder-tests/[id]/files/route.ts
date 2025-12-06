import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import mime from "mime-types";
import { ensureBinderFolders, saveBinderTestFile, BINDER_BASE_PATH } from "@/lib/binder/storage";
import { runHybridExtractionForBinderTest } from "@/lib/binder/hybridExtraction";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const binderTest = await prisma.binderTest.findUnique({ where: { id } });
    if (!binderTest) return new NextResponse("Not found", { status: 404 });

    const formData = await req.formData();
    const files = (formData.getAll("files") as File[]).filter((f) => f && f.size > 0);
    if (!files.length) return new NextResponse("No files provided", { status: 400 });

    const baseName = binderTest.testName || binderTest.name || "binder-test";
    const folderName =
      binderTest.folderName && binderTest.folderName !== "legacy-binder-test"
        ? binderTest.folderName
        : `${binderTest.id}-${baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "binder-test"}`;

    // Ensure base path exists (create if missing) and folders
    fs.mkdirSync(BINDER_BASE_PATH, { recursive: true });
    ensureBinderFolders(folderName);

    const originals = (binderTest.originalFiles as any) ?? { pdf: null, photos: [], videos: [] };
    const docRows: {
      originalName: string;
      storedPath: string;
      mimeType: string | null;
      sizeBytes: number | null;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.name) || ".bin";
      const target = `${Date.now()}-${i}${ext}`;
      const savedPath = await saveBinderTestFile(folderName, file, target);

      const mimeLower = (file.type || "").toLowerCase();
      docRows.push({
        originalName: file.name,
        storedPath: savedPath,
        mimeType: mimeLower || (mime.lookup(savedPath) as string | null) || null,
        sizeBytes: file.size,
      });
      if (mimeLower.includes("pdf")) {
        if (!originals.pdf) originals.pdf = savedPath;
        else originals.photos.push(savedPath); // store additional PDFs as photos list for reference
      } else if (mimeLower.startsWith("image/")) {
        originals.photos.push(savedPath);
      } else if (mimeLower.startsWith("video/")) {
        originals.videos.push(savedPath);
      } else {
        originals.photos.push(savedPath);
      }
    }

    // Re-run hybrid extraction
    const folderPath = path.join(BINDER_BASE_PATH, folderName);
    const extraction = await runHybridExtractionForBinderTest(folderPath);

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

    await prisma.$transaction(async (tx) => {
      await tx.binderTest.update({
        where: { id },
        data: {
          folderName,
          originalFiles: originals,
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

      if (docRows.length) {
        await tx.binderTestDocument.createMany({
          data: docRows.map((d) => ({
            binderTestId: binderTest.id,
            originalName: d.originalName,
            storedPath: d.storedPath,
            mimeType: d.mimeType,
            sizeBytes: d.sizeBytes ?? undefined,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to append files";
    console.error("Append files failed", msg);
    return new NextResponse(msg, { status: 500 });
  }
}
