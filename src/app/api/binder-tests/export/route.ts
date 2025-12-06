import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tests = await prisma.binderTest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "id",
    "name",
    "status",
    "binderSource",
    "crmPct",
    "reagentPct",
    "aerosilPct",
    "createdAt",
  ];
  const rows = tests.map((t) =>
    [
      t.id,
      t.name ?? "",
      t.status,
      t.binderSource ?? "",
      t.crmPct ?? "",
      t.reagentPct ?? "",
      t.aerosilPct ?? "",
      t.createdAt.toISOString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="binder-tests.csv"',
    },
  });
}
