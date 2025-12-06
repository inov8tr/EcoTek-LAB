import fs from "fs";
import path from "path";

// Base path on Unraid
export const BINDER_BASE_PATH = "/mnt/user/projects/EcoTek/Sample Site/project-files/binder-tests";

export function sanitizeTestName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureBinderFolders(folderName: string) {
  const originalDir = path.join(BINDER_BASE_PATH, folderName, "original");
  const aiDir = path.join(BINDER_BASE_PATH, folderName, "ai");
  const metadataDir = path.join(BINDER_BASE_PATH, folderName, "metadata");
  [originalDir, aiDir, metadataDir].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
  return { originalDir, aiDir, metadataDir };
}

export async function saveBinderTestFile(folderName: string, file: File, targetName: string) {
  const { originalDir } = ensureBinderFolders(folderName);
  const fullPath = path.join(originalDir, targetName);
  await fs.promises.writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  return fullPath;
}

export function fileToBase64(filePath: string, mime: string) {
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}
