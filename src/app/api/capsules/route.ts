export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApiUser } from "@/lib/api/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dbApi } from "@/lib/dbApi";

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

const capsuleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  materials: z.array(materialSchema).min(2).max(10),
});

function validateTotalPercentage(materials: { percentage: number }[]) {
  const total = materials.reduce((sum, item) => sum + item.percentage, 0);
  const rounded = Math.round(total * 1000) / 1000;
  if (Math.abs(rounded - 100) > 0.001) {
    return `Material percentages must total 100%. Currently ${rounded}%`;
  }
  return null;
}

export async function GET() {
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;

  const formulas = await prisma.capsuleFormula.findMany({
    include: {
      materials: {
        orderBy: { createdAt: "asc" },
      },
      pmaFormulas: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(formulas);
}

export async function POST(req: Request) {
  const authResult = await guardApiUser({
    roles: [UserRole.ADMIN, UserRole.RESEARCHER],
    requireActive: true,
  });
  if ("response" in authResult) return authResult.response;
  const user = authResult.user;

  try {
    const data = capsuleSchema.parse(await req.json());
    const totalError = validateTotalPercentage(data.materials);
    if (totalError) {
      return NextResponse.json({ error: totalError }, { status: 400 });
    }

    const created = await dbApi("/db/capsules", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        description: data.description ?? null,
        createdById: user.id,
        materials: data.materials,
      }),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("POST /api/capsules", error);
    return NextResponse.json({ error: "Unable to create capsule formula" }, { status: 500 });
  }
}
