import fs from "fs";
import path from "path";
import { extractTextFromPdf, parseBinderText, findMissingOrUncertainFields } from "./parser";
import { runAiFallbackExtraction } from "./aiExtraction";
import {
  BinderTestExtractedData,
  BinderTestValueSources,
  EMPTY_EXTRACTED,
} from "./types";

export interface HybridExtractionResult {
  data: BinderTestExtractedData;
  sources: BinderTestValueSources;
  usedAi: boolean;
}

export async function runHybridExtractionForBinderTest(folderPath: string): Promise<HybridExtractionResult> {
  const originalDir = path.join(folderPath, "original");
  const files = fs.existsSync(originalDir) ? fs.readdirSync(originalDir) : [];

  const pdfs = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
  const images = files.filter((f) => /\.(png|jpe?g|webp|heic)$/i.test(f));

  let parsed: BinderTestExtractedData = { ...EMPTY_EXTRACTED };
  const sources: BinderTestValueSources = {};

  // Deterministic parse from first PDF (if any)
  if (pdfs.length) {
    const pdfPath = path.join(originalDir, pdfs[0]);
    const text = await extractTextFromPdf(pdfPath);
    parsed = parseBinderText(text);
    (Object.keys(parsed) as (keyof BinderTestExtractedData)[]).forEach((k) => {
      if (parsed[k] !== null) sources[k] = "parser";
    });

    if (
      !parsed.performanceGrade &&
      parsed.pgHigh !== null &&
      parsed.pgLow !== null
    ) {
      parsed.performanceGrade = `PG ${parsed.pgHigh}-${Math.abs(parsed.pgLow)}`;
      sources.performanceGrade = sources.performanceGrade ?? "parser";
    }
  }

  const missing = findMissingOrUncertainFields(parsed);
  let aiResult: Partial<BinderTestExtractedData> = {};
  let usedAi = false;

  if (missing.length) {
    const filePaths = [...pdfs, ...images].map((f) => path.join(originalDir, f));
    aiResult = await runAiFallbackExtraction("", missing, filePaths);
    (Object.keys(aiResult) as (keyof BinderTestExtractedData)[]).forEach((k) => {
      if (aiResult[k] !== null && aiResult[k] !== undefined) {
        parsed[k] = aiResult[k] as any;
        sources[k] = "ai";
      }
    });
    usedAi = Object.keys(aiResult).length > 0;
  }

  return { data: parsed, sources, usedAi };
}
