import { NextResponse } from "next/server";

// Deletion is handled by the VM API alongside storage; this route intentionally blocks direct DB/MinIO access.
export async function POST() {
  return NextResponse.json(
    { error: "Uploads are managed by the VM API (/files/*). Deletion must be requested there." },
    { status: 410 },
  );
}
