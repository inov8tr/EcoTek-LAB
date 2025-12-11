import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRequest } from "@/lib/api/guard";

export async function GET() {
  const { user, errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB", "VIEWER"] });
  if (errorResponse) return errorResponse;

  try {
    const sets = await prisma.analysisSet.findMany({
      where: user?.id ? { ownerId: user.id } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: sets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
