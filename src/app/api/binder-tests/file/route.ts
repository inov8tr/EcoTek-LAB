import fs from "fs";
import path from "path";
import mime from "mime-types";
import { NextRequest, NextResponse } from "next/server";
import { BINDER_BASE_PATH } from "@/lib/binder/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  if (!filePath) return new NextResponse("Missing path", { status: 400 });

  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(BINDER_BASE_PATH, filePath.replace(/^\/+/, ""));
  const normalized = path.normalize(resolved);
  if (!normalized.startsWith(BINDER_BASE_PATH)) {
    return new NextResponse("Invalid path", { status: 400 });
  }
  if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const mimeType = mime.lookup(normalized) || "application/octet-stream";
  const data = fs.readFileSync(normalized);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${path.basename(normalized)}"`,
    },
  });
}
