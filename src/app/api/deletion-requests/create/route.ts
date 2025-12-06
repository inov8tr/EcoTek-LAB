import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeleteStatus, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === UserRole.VIEWER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetTable, targetId, reason } = await request.json();
  if (!targetTable || !targetId || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.deletionRequest.create({
    data: {
      targetTable,
      targetId: String(targetId),
      reason,
      requesterId: session.user.id,
      status: DeleteStatus.PENDING,
    },
  });

  revalidatePath("/admin/deletion-requests");

  return NextResponse.json({ success: true });
}
