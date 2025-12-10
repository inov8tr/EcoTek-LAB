import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;

  try {
    await prisma.bitumenOrigin.update({
      where: { id },
      data: { archived: true, archivedAt: new Date() },
    });
    revalidatePath("/bitumen/origins");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Origin not found" }, { status: 404 });
    }
    console.error("POST /api/bitumen/origins/[id]/archive", error);
    return NextResponse.json({ error: "Unable to archive origin" }, { status: 500 });
  }
}
