import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.warn(`Extraction endpoint hit for binder test ${id}, but BinderTestData is removed.`);
  return new NextResponse("Binder test data extraction is not available in this build.", {
    status: 410,
  });
}
