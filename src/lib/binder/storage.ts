import fs from "fs";
import path from "path";

const DEFAULT_BINDER_PATH = path.join(process.cwd(), "project-files", "binder-tests");
// Allow override for production (e.g., Unraid) via env; fall back to writable project-files for dev.
export const BINDER_BASE_PATH = process.env.BINDER_BASE_PATH ?? DEFAULT_BINDER_PATH;

export function sanitizeTestName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureBinderFolders(folderName: string) {
  fs.mkdirSync(BINDER_BASE_PATH, { recursive: true });
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
