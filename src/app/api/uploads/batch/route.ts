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
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== UserRole.ADMIN && role !== UserRole.RESEARCHER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const batchId = Number(formData.get("batchId"));

  if (!(file instanceof File) || !batchId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 20MB limit." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const { filePath, url } = await saveUploadFile(file);

  const attachment = await prisma.fileAttachment.create({
    data: {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
      storagePath: filePath,
      uploadedById: session.user.id,
      batchId: batch.id,
    },
    include: {
      uploader: {
        select: { name: true, email: true },
      },
    },
  });

  revalidatePath(`/batches/${batch.slug}`);

  return NextResponse.json({ attachment });
}
