import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeleteStatus, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId } = await request.json();
  if (!requestId) {
    return NextResponse.json({ error: "Missing request id" }, { status: 400 });
  }

  await prisma.deletionRequest.update({
    where: { id: Number(requestId) },
    data: {
      status: DeleteStatus.APPROVED,
      reviewerId: session.user.id,
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/admin/deletion-requests");
  return NextResponse.json({ success: true });
}
