import { NextRequest, NextResponse } from "next/server";
import { BinderTestStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const contextParams = await context.params;
  const fromContext = contextParams?.id;
  const fromPath = req.nextUrl?.pathname?.split("/")?.filter(Boolean)?.at(-2);
  const id = fromContext || fromPath;
  if (!id) return new NextResponse("Missing id", { status: 400 });

  try {
    await prisma.binderTest.update({
      where: { id },
      data: { status: BinderTestStatus.ARCHIVED },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Archive binder test failed", err);
    return new NextResponse("Failed to archive", { status: 500 });
  }
}
