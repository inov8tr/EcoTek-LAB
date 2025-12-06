import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const test = await prisma.binderTestData.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!test) return new NextResponse("Not found", { status: 404 });
    if (test.files.length === 0) {
      return new NextResponse("No files to extract from", { status: 400 });
    }

    const fakeResult = await prisma.binderTestDataResult.create({
      data: {
        binderTestId: test.id,
        temperature: 76,
        gOriginal: 1.41,
        gRtfo: 2.38,
        gPav: 5.82,
        pgHigh: 76,
        pgLow: -28,
        passFail: "PASS",
        notes: "Stub extraction result – replace with real OCR.",
      },
    });

    return NextResponse.json({ id: fakeResult.id });
  } catch (err) {
    console.error(err);
    return new NextResponse("Extraction failed", { status: 500 });
  }
}
