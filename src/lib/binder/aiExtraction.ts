import fs from "fs";
import mime from "mime-types";
import OpenAI from "openai";
import { fileToBase64 } from "@/lib/binder/storage";
import type { BinderTestExtractedData } from "@/lib/binder/types";

const openaiApiKey = process.env.OPENAI_API_KEY;

export async function runAiFallbackExtraction(
  binderTestId: string,
  fieldsNeeded: (keyof BinderTestExtractedData)[],
  filePaths: string[],
): Promise<Partial<BinderTestExtractedData>> {
  if (!openaiApiKey || fieldsNeeded.length === 0) return {};
  const client = new OpenAI({ apiKey: openaiApiKey });

  const base64Inputs: string[] = [];
  for (const file of filePaths) {
    if (!fs.existsSync(file)) continue;
    const mimeType = mime.lookup(file) || "application/octet-stream";
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      base64Inputs.push(fileToBase64(file, mimeType));
    }
  }
  if (!base64Inputs.length) return {};

  const keyHint =
    "Keys: performanceGrade, flashPointCOC_C, viscosity155_PaS, pgHigh, pgLow, softeningPointC, viscosity155_cP, ductilityCm, recoveryPct, jnr_3_2, dsr_original_82C_kPa, rtfo_massChange_pct, dsr_rtfo_82C_kPa, dsr_pav_34C_kPa, bbr_stiffness_minus12C_MPa, bbr_mValue_minus12C, mscr_jnr_3_2_kPa_inv, mscr_percentRecovery_64C_pct, mscr_percentRecoveryOverall_pct, testingLocation, testReportNumber, sampleName, testDate, labName, dsrData.";

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content: "You are a lab assistant extracting asphalt binder test data. Respond ONLY with valid JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Provide JSON for only these fields: ${fieldsNeeded.join(", ")}. Null if missing. ${keyHint}`,
          },
          ...base64Inputs.map((b64) => ({
            type: "input_image",
            image_url: { url: b64, detail: "auto" },
          })),
        ] as any,
      },
    ] as any,
  });

  const content = (response as any)?.output?.[0]?.content?.[0];
  if (!content || content.type !== "output_text") return {};

  try {
    const parsed = JSON.parse(content.text) as Partial<BinderTestExtractedData>;
    return parsed;
  } catch {
    return {};
  }
}
