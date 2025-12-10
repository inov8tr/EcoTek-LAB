import { NextRequest, NextResponse } from "next/server";
import { BinderTestStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { captureClientMetadata } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action === "restore" ? "restore" : "archive";
  const archived = action === "archive";

  const updated = await prisma.binderTest.update({
    where: { id },
    // Cast to any to satisfy older Prisma types in some editors.
    data: {
      archived,
      archivedAt: archived ? new Date() : null,
      status: archived ? BinderTestStatus.ARCHIVED : BinderTestStatus.PENDING_REVIEW,
    } as any,
    select: { id: true, name: true },
  });

  const meta = await captureClientMetadata();
  await prisma.securityEvent.create({
    data: {
      userId: user.id,
      eventType: archived ? "BINDER_TEST_ARCHIVED" : "BINDER_TEST_RESTORED",
      detail: `${archived ? "Archived" : "Restored"} binder test ${updated.id} (${updated.name ?? "Untitled"})`,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  return NextResponse.json({ success: true, archived });
}
