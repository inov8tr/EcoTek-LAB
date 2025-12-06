import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const uploadDir = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

export async function saveUploadFile(file: File) {
  await ensureUploadDir();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = crypto.randomBytes(8).toString("hex");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}_${hash}_${safeName}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  const url = `/uploads/${fileName}`;
  return { fileName, filePath, url };
}

export async function deleteUploadFile(storagePath: string) {
  try {
    await fs.unlink(storagePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
