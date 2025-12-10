import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.RESEARCHER)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type")?.toString() as "image" | "video" | undefined;

  if (!file || !type) {
    return new NextResponse("Missing file or type", { status: 400 });
  }

  console.warn(`Binder test media upload hit for ${id}, but legacy BinderTestDataMedia is removed.`);
  return new NextResponse("Binder test media upload is not available in this build.", { status: 410 });
}
