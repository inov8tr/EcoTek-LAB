import { NextResponse } from "next/server";

// Deprecated: uploads are handled via the Python API (/files/upload). Keep this route to prevent direct MinIO usage.
export async function POST() {
  return NextResponse.json({ error: "Uploads must use the Python API (/files/upload)" }, { status: 410 });
}
