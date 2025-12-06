import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadFile } from "@/lib/uploads";
import { UserRole } from "@prisma/client";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
];

const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  // Deprecated: legacy binder test uploads removed in favor of BinderTestData.
  return NextResponse.json({ error: "Deprecated binder test upload" }, { status: 410 });
}
