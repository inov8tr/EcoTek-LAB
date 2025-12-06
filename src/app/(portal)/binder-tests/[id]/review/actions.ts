"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BINDER_BASE_PATH } from "@/lib/binder/storage";
import {
  BinderTestExtractedData,
  BinderTestValueSources,
  EMPTY_EXTRACTED,
} from "@/lib/binder/types";

export async function saveBinderTestReview(binderTestId: string, formData: FormData) {
  const existing = await prisma.binderTest.findUnique({ where: { id: binderTestId } });
  if (!existing) return;

  const aiPayload = (existing.aiExtractedData as any) ?? {};
  const aiData: Partial<BinderTestExtractedData> = (aiPayload?.data as any) ?? {};
  const aiSources: BinderTestValueSources = (aiPayload?.sources as any) ?? {};

  const baseData: BinderTestExtractedData = {
    ...EMPTY_EXTRACTED,
    ...aiData,
    performanceGrade: aiData.performanceGrade ?? (existing.pgHigh && existing.pgLow ? `PG ${existing.pgHigh}-${Math.abs(existing.pgLow)}` : null),
    flashPointCOC_C: aiData.flashPointCOC_C ?? null,
    viscosity155_PaS: aiData.viscosity155_PaS ?? (existing.viscosity155_cP ? existing.viscosity155_cP / 1000 : null),
    pgHigh: existing.pgHigh ?? aiData.pgHigh ?? null,
    pgLow: existing.pgLow ?? aiData.pgLow ?? null,
    softeningPointC: existing.softeningPointC ?? aiData.softeningPointC ?? null,
    viscosity155_cP: existing.viscosity155_cP ?? aiData.viscosity155_cP ?? null,
    ductilityCm: existing.ductilityCm ?? aiData.ductilityCm ?? null,
    recoveryPct: existing.recoveryPct ?? aiData.recoveryPct ?? null,
    jnr_3_2: existing.jnr_3_2 ?? aiData.jnr_3_2 ?? null,
    dsr_original_82C_kPa: aiData.dsr_original_82C_kPa ?? null,
    rtfo_massChange_pct: aiData.rtfo_massChange_pct ?? null,
    dsr_rtfo_82C_kPa: aiData.dsr_rtfo_82C_kPa ?? null,
    dsr_pav_34C_kPa: aiData.dsr_pav_34C_kPa ?? null,
    bbr_stiffness_minus12C_MPa: aiData.bbr_stiffness_minus12C_MPa ?? null,
    bbr_mValue_minus12C: aiData.bbr_mValue_minus12C ?? null,
    mscr_jnr_3_2_kPa_inv: aiData.mscr_jnr_3_2_kPa_inv ?? aiData.jnr_3_2 ?? null,
    mscr_percentRecovery_64C_pct: aiData.mscr_percentRecovery_64C_pct ?? null,
    mscr_percentRecoveryOverall_pct: aiData.mscr_percentRecoveryOverall_pct ?? aiData.recoveryPct ?? null,
    testingLocation: aiData.testingLocation ?? null,
    testReportNumber: aiData.testReportNumber ?? null,
    sampleName: aiData.sampleName ?? (existing.name ?? existing.binderSource ?? null),
    testDate: aiData.testDate ?? null,
    labName: aiData.labName ?? (existing as any).lab ?? null,
    dsrData: (existing.dsrData as any) ?? aiData.dsrData ?? null,
  };

  const numericFields: (keyof BinderTestExtractedData)[] = [
    "flashPointCOC_C",
    "viscosity155_PaS",
    "pgHigh",
    "pgLow",
    "softeningPointC",
    "viscosity155_cP",
    "ductilityCm",
    "recoveryPct",
    "jnr_3_2",
    "dsr_original_82C_kPa",
    "rtfo_massChange_pct",
    "dsr_rtfo_82C_kPa",
    "dsr_pav_34C_kPa",
    "bbr_stiffness_minus12C_MPa",
    "bbr_mValue_minus12C",
    "mscr_jnr_3_2_kPa_inv",
    "mscr_percentRecovery_64C_pct",
    "mscr_percentRecoveryOverall_pct",
  ];

  const fields: (keyof BinderTestExtractedData)[] = [
    "performanceGrade",
    "flashPointCOC_C",
    "viscosity155_PaS",
    "pgHigh",
    "pgLow",
    "softeningPointC",
    "viscosity155_cP",
    "ductilityCm",
    "recoveryPct",
    "jnr_3_2",
    "dsr_original_82C_kPa",
    "rtfo_massChange_pct",
    "dsr_rtfo_82C_kPa",
    "dsr_pav_34C_kPa",
    "bbr_stiffness_minus12C_MPa",
    "bbr_mValue_minus12C",
    "mscr_jnr_3_2_kPa_inv",
    "mscr_percentRecovery_64C_pct",
    "mscr_percentRecoveryOverall_pct",
    "testingLocation",
    "testReportNumber",
    "sampleName",
    "testDate",
    "labName",
  ];

  const rawSources = formData.get("sources");
  let incomingSources: BinderTestValueSources = {};
  if (typeof rawSources === "string" && rawSources.trim()) {
    try {
      incomingSources = JSON.parse(rawSources) as BinderTestValueSources;
    } catch {
      incomingSources = {};
    }
  }
  const mergedSources: BinderTestValueSources = { ...aiSources, ...incomingSources };

  const updates: Partial<BinderTestExtractedData> = {};
  const edits: any[] = Array.isArray(existing.manualEdits) ? [...(existing.manualEdits as any[])] : [];

  for (const field of fields) {
    const raw = formData.get(field);
    let value: string | number | null = null;
    if (raw !== null && raw !== undefined && raw.toString().trim() !== "") {
      if (numericFields.includes(field)) {
        const num = Number(raw);
        value = Number.isFinite(num) ? num : null;
      } else {
        value = raw.toString().trim();
      }
    }

    const oldValue = (baseData as any)[field] ?? null;
    const newValue = value ?? null;

    if (oldValue !== newValue) {
      updates[field] = value as any;
      edits.push({
        field,
        oldValue,
        newValue,
        editedAt: new Date().toISOString(),
      });
      mergedSources[field] = "manual";
    }
  }

  const finalData: BinderTestExtractedData = {
    ...baseData,
    ...updates,
    dsrData: baseData.dsrData,
  };

  if (!finalData.performanceGrade && finalData.pgHigh !== null && finalData.pgLow !== null) {
    finalData.performanceGrade = `PG ${finalData.pgHigh}-${Math.abs(finalData.pgLow)}`;
  }
  if (finalData.viscosity155_PaS === null && typeof finalData.viscosity155_cP === "number") {
    finalData.viscosity155_PaS = finalData.viscosity155_cP / 1000;
  }
  if (finalData.viscosity155_cP === null && typeof finalData.viscosity155_PaS === "number") {
    finalData.viscosity155_cP = finalData.viscosity155_PaS * 1000;
  }
  if (finalData.mscr_jnr_3_2_kPa_inv === null && typeof finalData.jnr_3_2 === "number") {
    finalData.mscr_jnr_3_2_kPa_inv = finalData.jnr_3_2;
  }
  if (
    finalData.mscr_percentRecoveryOverall_pct === null &&
    typeof finalData.recoveryPct === "number"
  ) {
    finalData.mscr_percentRecoveryOverall_pct = finalData.recoveryPct;
  }
  if (finalData.labName === null && typeof (existing as any).lab === "string") {
    finalData.labName = (existing as any).lab;
  }
  if (finalData.sampleName === null && typeof (existing as any).name === "string") {
    finalData.sampleName = (existing as any).name;
  }

  if (existing.folderName) {
    const folderPath = path.join(BINDER_BASE_PATH, existing.folderName, "metadata");
    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(
      path.join(folderPath, "final_validated.json"),
      JSON.stringify(finalData, null, 2),
    );
  }

  await prisma.binderTest.update({
    where: { id: binderTestId },
    data: {
      pgHigh: finalData.pgHigh,
      pgLow: finalData.pgLow,
      softeningPointC: finalData.softeningPointC,
      viscosity155_cP: finalData.viscosity155_cP,
      ductilityCm: finalData.ductilityCm,
      recoveryPct: finalData.recoveryPct,
      jnr_3_2: finalData.jnr_3_2,
      dsrData: finalData.dsrData as any,
      aiExtractedData: { data: finalData, sources: mergedSources },
      manualEdits: edits,
      status: "READY",
    },
  });

  revalidatePath(`/binder-tests/${binderTestId}`);
  revalidatePath(`/binder-tests/${binderTestId}/review`);
}
