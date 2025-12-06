import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Simple local storage helper that saves files under /public/uploads/binder-tests.
// Replace with S3/Supabase if/when available.
export async function uploadBinderAsset(
  binderTestId: string,
  kind: "pdf" | "image" | "video",
  file: File
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", "binder-tests", binderTestId, kind);
  await fs.mkdir(dir, { recursive: true });
  const destPath = path.join(dir, filename);
  await fs.writeFile(destPath, buffer);
  return `/uploads/binder-tests/${binderTestId}/${kind}/${filename}`;
}
