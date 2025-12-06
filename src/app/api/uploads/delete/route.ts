import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadFile } from "@/lib/uploads";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { attachmentId } = await request.json();
  if (!attachmentId) {
    return NextResponse.json({ error: "Missing attachment id" }, { status: 400 });
  }

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: Number(attachmentId) },
    include: {
      batch: { select: { slug: true } },
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  await prisma.fileAttachment.delete({ where: { id: attachment.id } });
  await deleteUploadFile(attachment.storagePath);

  if (attachment.batch?.slug) {
    revalidatePath(`/batches/${attachment.batch.slug}`);
  }

  return NextResponse.json({ success: true });
}
