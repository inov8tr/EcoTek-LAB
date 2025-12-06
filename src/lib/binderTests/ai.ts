import fs from "fs";
import path from "path";
import mime from "mime-types";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { fileToBase64 } from "@/lib/binder/storage";

const openaiApiKey = process.env.OPENAI_API_KEY;
const BINDER_BASE_PATH = "/mnt/user/projects/EcoTek/Sample Site/project-files/binder-tests";

export async function runBinderTestExtraction(binderTestId: string, folderName?: string) {
  if (!openaiApiKey) {
    console.warn("OPENAI_API_KEY not set; skipping binder test extraction");
    return;
  }

  const binderTest = await prisma.binderTest.findUnique({
    where: { id: binderTestId },
  });
  if (!binderTest) return;

  const resolvedFolder = folderName ?? binderTest.folderName;
  const originalDir = path.join(BINDER_BASE_PATH, resolvedFolder, "original");
  if (!fs.existsSync(originalDir)) return;

  const files = fs.readdirSync(originalDir);
  const base64Inputs: string[] = [];
  for (const file of files) {
    const filePath = path.join(originalDir, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;
    const mimeType = mime.lookup(filePath) || "application/octet-stream";
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      base64Inputs.push(fileToBase64(filePath, mimeType));
    }
  }

  if (base64Inputs.length === 0) return;

  const client = new OpenAI({ apiKey: openaiApiKey });

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content: "Extract asphalt binder test data. Respond ONLY with valid JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Extract pgHigh, pgLow, softeningPointC, viscosity155_cP, ductilityCm, recoveryPct, jnr_3_2, dsrData.",
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
  if (!content || content.type !== "output_text") return;

  let aiJson: any;
  try {
    aiJson = JSON.parse(content.text);
  } catch {
    return;
  }

  const confidence =
    typeof aiJson?.confidence === "number" && aiJson.confidence >= 0 && aiJson.confidence <= 1
      ? aiJson.confidence
      : 0.9;

  // Save AI JSON to filesystem
  const aiDir = path.join(BINDER_BASE_PATH, resolvedFolder, "ai");
  fs.mkdirSync(aiDir, { recursive: true });
  fs.writeFileSync(path.join(aiDir, "ai_extraction.json"), JSON.stringify(aiJson, null, 2));

  await prisma.binderTest.update({
    where: { id: binderTestId },
    data: {
      aiExtractedData: aiJson,
      aiConfidence: confidence,
    },
  });
}
