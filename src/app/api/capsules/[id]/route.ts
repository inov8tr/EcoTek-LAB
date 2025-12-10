import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";

const percentageSchema = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const num = Number(val);
    return Number.isFinite(num) ? num : val;
  },
  z.number().min(0).max(100),
);

const materialSchema = z.object({
  materialName: z.string().trim().min(1, "Material name is required"),
  percentage: percentageSchema,
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
});

function validateTotalPercentage(materials: { percentage: number }[]) {
  const total = materials.reduce((sum, item) => sum + item.percentage, 0);
  const rounded = Math.round(total * 1000) / 1000;
  if (Math.abs(rounded - 100) > 0.001) {
    return `Material percentages must total 100%. Currently ${rounded}%`;
  }
  return null;
}

type RouteParams = { params: { id: string } };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;

  const formula = await prisma.capsuleFormula.findUnique({
    where: { id },
    include: {
      pmaFormulas: {
        include: {
          bitumenOrigin: true,
          bitumenTest: true,
        },
      },
    },
  });

  if (!formula) {
    return NextResponse.json({ error: "Capsule formula not found" }, { status: 404 });
  }

  return NextResponse.json(formula);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;

  try {
    const data = updateSchema.parse(await req.json());
  if (!data.name && !data.description) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const existing = await prisma.capsuleFormula.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Capsule formula not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.capsuleFormula.update({
        where: { id },
        data: {
          name: data.name ?? existing.name,
          description:
            data.description !== undefined ? data.description : existing.description,
        },
      });

      return updated;
    });

    const formula = await prisma.capsuleFormula.findUnique({
      where: { id },
      include: {
        pmaFormulas: {
          include: {
            bitumenOrigin: true,
            bitumenTest: true,
          },
        },
      },
    });

    return NextResponse.json(formula ?? result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error(`PATCH /api/capsules/${id}`, error);
    return NextResponse.json({ error: "Unable to update capsule formula" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;

  const linkedCount = await prisma.pmaFormula.count({
    where: { capsuleFormulaId: id },
  });
  if (linkedCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete capsule formula with linked PMA formulas" },
      { status: 409 },
    );
  }

  try {
    await prisma.capsuleFormula.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/capsules/${id}`, error);
    return NextResponse.json({ error: "Unable to delete capsule formula" }, { status: 500 });
  }
}
