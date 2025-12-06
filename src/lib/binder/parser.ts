import fs from "fs";
import { BinderTestExtractedData, EMPTY_EXTRACTED } from "./types";

export async function extractTextFromPdf(localPath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(localPath));
  // Use pdfjs-dist legacy build for Node
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data, useWorkerFetch: false }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str).filter(Boolean);
    out += strings.join(" ") + "\n";
  }
  return out;
}

export function parseBinderText(text: string): BinderTestExtractedData {
  const result: BinderTestExtractedData = { ...EMPTY_EXTRACTED };
  const lower = text.toLowerCase();

  // PG pattern e.g., PG 76-28
  const pgMatch = lower.match(/pg\s*([0-9]{2})\s*[-/]\s*([0-9]{2})/);
  if (pgMatch) {
    result.pgHigh = parseInt(pgMatch[1], 10);
    result.pgLow = -parseInt(pgMatch[2], 10);
    result.performanceGrade = `PG ${pgMatch[1]}-${pgMatch[2]}`;
  }

  const flashMatch = lower.match(/flash(?:\s*point)?(?:\s*\(coc\))?[^0-9-]*(-?[0-9]+(?:\.[0-9]+)?)/);
  if (flashMatch) result.flashPointCOC_C = parseFloat(flashMatch[1]);

  const softMatch = lower.match(/softening(?:\s+point)?[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (softMatch) result.softeningPointC = parseFloat(softMatch[1]);

  const viscPaMatch = lower.match(/viscosity[^0-9]*155[^0-9]*([0-9]+(?:\.[0-9]+)?)[^0-9a-z]*(pa)/);
  const viscMatch = lower.match(/viscosity[^0-9]*155[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (viscPaMatch) {
    const val = parseFloat(viscPaMatch[1]);
    result.viscosity155_PaS = val;
    result.viscosity155_cP = Number.isFinite(val) ? val * 1000 : null;
  } else if (viscMatch) {
    const val = parseFloat(viscMatch[1]);
    result.viscosity155_cP = val;
    result.viscosity155_PaS = Number.isFinite(val) ? val / 1000 : null;
  }

  const ductMatch = lower.match(/ductility[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (ductMatch) result.ductilityCm = parseFloat(ductMatch[1]);

  const recMatch = lower.match(/recovery[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (recMatch) result.recoveryPct = parseFloat(recMatch[1]);

  const jnrMatch = lower.match(/jnr[^0-9]*3\.?2[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (jnrMatch) result.jnr_3_2 = parseFloat(jnrMatch[1]);

  const mscrJnrMatch = lower.match(/mscr[^0-9]*jnr[^0-9]*3\.?2[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (mscrJnrMatch) result.mscr_jnr_3_2_kPa_inv = parseFloat(mscrJnrMatch[1]);

  const mscrRecMatch = lower.match(/(?:mscr\s*)?(?:percent\s*)?recovery[^0-9]*64[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (mscrRecMatch) result.mscr_percentRecovery_64C_pct = parseFloat(mscrRecMatch[1]);

  const mscrOverallRecMatch = lower.match(/(?:percent\s*recovery|mscr\s*recovery)[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (mscrOverallRecMatch) result.mscr_percentRecoveryOverall_pct = parseFloat(mscrOverallRecMatch[1]);

  const rtfoMassMatch = lower.match(/rtfo[^\n]*mass[^0-9-]*(-?[0-9]+(?:\.[0-9]+)?)/);
  if (rtfoMassMatch) result.rtfo_massChange_pct = parseFloat(rtfoMassMatch[1]);

  const dsrOriginalMatch = lower.match(/original[^\n]*g\*\/\s*sin.?d[^0-9]*82[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (dsrOriginalMatch) result.dsr_original_82C_kPa = parseFloat(dsrOriginalMatch[1]);

  const dsrRtfoMatch = lower.match(/rtfo[^\n]*g\*\/\s*sin.?d[^0-9]*82[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (dsrRtfoMatch) result.dsr_rtfo_82C_kPa = parseFloat(dsrRtfoMatch[1]);

  const dsrPavMatch = lower.match(/pav[^\n]*g\*\/\s*sin.?d[^0-9]*34[^0-9]*([0-9]+(?:\.[0-9]+)?)/);
  if (dsrPavMatch) result.dsr_pav_34C_kPa = parseFloat(dsrPavMatch[1]);

  const bbrStiffMatch = lower.match(/bbr[^\n]*stiffness[^0-9-]*(-?[0-9]+(?:\.[0-9]+)?)/);
  if (bbrStiffMatch) result.bbr_stiffness_minus12C_MPa = parseFloat(bbrStiffMatch[1]);

  const bbrMValueMatch = lower.match(/bbr[^\n]*m[-\s]?value[^0-9-]*(-?[0-9]+(?:\.[0-9]+)?)/);
  if (bbrMValueMatch) result.bbr_mValue_minus12C = parseFloat(bbrMValueMatch[1]);

  const dsrMatches = [...lower.matchAll(/g\*\/\s*sin.?d[^0-9]*([0-9]+)[^\d]+([0-9]+(?:\.[0-9]+)?)/g)];
  if (dsrMatches.length) {
    const dsrData: Record<string, number> = {};
    dsrMatches.forEach((m) => {
      const temp = m[1];
      const val = m[2];
      if (temp && val) dsrData[temp] = parseFloat(val);
    });
    result.dsrData = Object.keys(dsrData).length ? dsrData : null;
  }

  return result;
}

export function findMissingOrUncertainFields(
  data: BinderTestExtractedData
): (keyof BinderTestExtractedData)[] {
  return (Object.keys(data) as (keyof BinderTestExtractedData)[]).filter((k) => {
    const val = data[k];
    return val === null || val === "";
  });
}
