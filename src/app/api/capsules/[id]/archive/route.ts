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
    await prisma.capsuleFormula.update({
      where: { id },
      data: { archived: true, archivedAt: new Date() },
    });
    revalidatePath("/capsules");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Capsule not found" }, { status: 404 });
    }
    console.error("POST /api/capsules/[id]/archive", error);
    return NextResponse.json({ error: "Unable to archive capsule" }, { status: 500 });
  }
}
