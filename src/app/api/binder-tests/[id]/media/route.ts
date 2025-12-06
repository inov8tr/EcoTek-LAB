import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadBinderAsset } from "@/lib/binder/upload";
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

  try {
    const url = await uploadBinderAsset(id, type, file);
    const record = await prisma.binderTestDataMedia.create({
      data: {
        binderTestId: id,
        mediaUrl: url,
        mediaType: type,
        label: type === "image" ? "Photo" : "Video",
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (err) {
    console.error(err);
    return new NextResponse("Upload failed", { status: 500 });
  }
}
