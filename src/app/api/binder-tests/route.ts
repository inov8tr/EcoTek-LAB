import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import mime from "mime-types";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { BINDER_BASE_PATH, sanitizeTestName, ensureBinderFolders, saveBinderTestFile } from "@/lib/binder/storage";
import {
  computeDeltaSoftening,
  computeGstarStability,
  computeJnrStability,
  computeRecoveryStability,
} from "@/lib/binder/computeStorageStability";
import { logApiRequest } from "@/lib/request-logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    await logApiRequest({ req, userId: user?.id, action: "binder-test:create", status: 401, category: "api" });
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

  const extracted = {
    pgHigh: parseFloatOrNull(formData.get("pgHigh")),
    pgLow: parseFloatOrNull(formData.get("pgLow")),
    softeningTop: parseFloatOrNull(formData.get("softeningTop")),
    softeningBottom: parseFloatOrNull(formData.get("softeningBottom")),
    deltaSoftening: parseFloatOrNull(formData.get("deltaSoftening")),
    viscosity135: parseFloatOrNull(formData.get("viscosity135")),
    softeningPoint: parseFloatOrNull(formData.get("softeningPoint")),
    ductility15: parseFloatOrNull(formData.get("ductility15")),
    ductility25: parseFloatOrNull(formData.get("ductility25")),
    recovery: parseFloatOrNull(formData.get("recovery")),
    jnr: parseFloatOrNull(formData.get("jnr")),
    solubility: parseFloatOrNull(formData.get("solubility")),
  };

  const parsedRecoveryValues = parseNumberArray(formData.get("recoveryValues"));
  const parsedGstarValues = parseNumberArray(formData.get("gstarValues"));
  const parsedJnrValues = parseNumberArray(formData.get("jnrValues"));

  const storageStabilityRecoveryPercent = computeRecoveryStability(parsedRecoveryValues);
  const storageStabilityGstarPercent = computeGstarStability(parsedGstarValues);
  const storageStabilityJnrPercent = computeJnrStability(parsedJnrValues);
  const computedDeltaSoftening =
    extracted.deltaSoftening ??
    computeDeltaSoftening(extracted.softeningTop ?? null, extracted.softeningBottom ?? null);

  const pdfFile = formData.get("pdfReport") as File | null;
  const photos = (formData.getAll("photos") as File[]).filter(Boolean);
  const videos = (formData.getAll("videos") as File[]).filter(Boolean);

  try {
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
      data: {
        folderName,
        originalFiles: fileMeta,
        pgHigh: extracted.pgHigh ?? undefined,
        pgLow: extracted.pgLow ?? undefined,
        softeningPointC: extracted.softeningPoint ?? undefined,
        ductilityCm: extracted.ductility15 ?? undefined,
        recoveryPct: extracted.recovery ?? undefined,
        jnr_3_2: extracted.jnr ?? undefined,
      },
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

    // Optional: store extracted values in TestResult if batchId is provided and numeric
    const batchIdResolved = await resolveBatchId(payload.batchId);
    if (batchIdResolved !== null) {
      await prisma.testResult.create({
        data: {
          batchId: batchIdResolved,
          pgHigh: extracted.pgHigh ?? undefined,
          pgLow: extracted.pgLow ?? undefined,
          storabilityPct: computedDeltaSoftening ?? undefined,
          solubilityPct: extracted.solubility ?? undefined,
          jnr: extracted.jnr ?? undefined,
          elasticRecoveryPct: extracted.recovery ?? undefined,
          softeningPointC: extracted.softeningPoint ?? undefined,
          ductilityCm: extracted.ductility15 ?? undefined,
          viscosityPaS: extracted.viscosity135 ? extracted.viscosity135 / 1000 : undefined,
          storageStabilityRecoveryPercent: storageStabilityRecoveryPercent ?? undefined,
          storageStabilityGstarPercent: storageStabilityGstarPercent ?? undefined,
          storageStabilityJnrPercent: storageStabilityJnrPercent ?? undefined,
          deltaSoftening: computedDeltaSoftening ?? undefined,
          recovery: extracted.recovery ?? undefined,
          solubility: extracted.solubility ?? undefined,
          remarks: "Auto-extracted via PDF upload",
        },
      });
    }

    await logApiRequest({ req, userId: user.id, action: "binder-test:create", status: 200, category: "api" });
    return NextResponse.json({ id: binderTest.id, folderName });
  } catch (err) {
    console.error(err);
    await logApiRequest({ req, userId: user.id, action: "binder-test:create", status: 500, category: "api" });
    return new NextResponse("Failed to create binder test", { status: 500 });
  }
}

function parseFloatOrNull(val: FormDataEntryValue | null): number | null {
  if (!val) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function parseNumberArray(entry: FormDataEntryValue | null): number[] {
  if (!entry) return [];
  if (entry instanceof File) return [];
  try {
    const parsed = JSON.parse(entry.toString());
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v));
    }
  } catch {
    // ignore parse error
  }
  return [];
}

async function resolveBatchId(batchIdRaw: string | number | null): Promise<number | null> {
  if (batchIdRaw === null || batchIdRaw === undefined) return null;
  const numeric = typeof batchIdRaw === "string" ? Number(batchIdRaw) : batchIdRaw;
  if (Number.isInteger(numeric)) return Number(numeric);

  if (typeof batchIdRaw === "string" && batchIdRaw.trim()) {
    const batch = await prisma.batch.findFirst({
      where: {
        OR: [{ batchCode: batchIdRaw.trim() }, { slug: batchIdRaw.trim() }],
      },
      select: { id: true },
    });
    if (batch) return batch.id;
  }
  return null;
}
