import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bitumenTestBody } from "@/lib/api/validators";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Utility: enforce auth once
async function requireResearcher() {
  const auth = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in auth) return auth.response; // return error response
  return null;
}

// ----------------------------- GET -----------------------------
export async function GET(req: Request) {
  const authError = await requireResearcher();
  if (authError) return authError;

  const url = new URL(req.url);
  const originId = url.searchParams.get("originId");

  try {
    const tests = await prisma.bitumenBaseTest.findMany({
      where: originId ? { bitumenOriginId: originId } : undefined,
      include: { bitumenOrigin: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tests);
  } catch (err) {
    console.error("GET /api/bitumen-tests", err);
    return NextResponse.json(
      { error: "Failed to load bitumen tests" },
      { status: 500 }
    );
  }
}

// ----------------------------- POST -----------------------------
export async function POST(req: Request) {
  const authError = await requireResearcher();
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = bitumenTestBody.parse(body);

    const created = await prisma.bitumenBaseTest.create({
      data: {
        bitumenOriginId: data.bitumenOriginId,
        batchCode: data.batchCode,
        softeningPoint: data.softeningPoint,
        penetration: data.penetration,
        viscosity135: data.viscosity135,
        viscosity165: data.viscosity165,
        basePgHigh: data.basePgHigh,
        basePgLow: data.basePgLow,
        baseDuctility: data.baseDuctility,
        baseRecovery: data.baseRecovery,
        testedAt: data.testedAt ? new Date(data.testedAt) : null,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten() },
        { status: 400 }
      );
    }

    console.error("POST /api/bitumen-tests", err);
    return NextResponse.json(
      { error: "Failed to create bitumen test" },
      { status: 500 }
    );
  }
}
