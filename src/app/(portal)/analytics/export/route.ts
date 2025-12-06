import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const batches = await prisma.batch.findMany({
    include: { formulation: true },
    orderBy: { dateMixed: "desc" },
    take: 200,
  });

  const header = ["batchCode", "formulation", "dateMixed", "operator", "status"];
  const rows = batches.map((b) =>
    [
      b.batchCode,
      b.formulation?.code ?? "",
      b.dateMixed.toISOString(),
      b.operator ?? "",
      b.status ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="analytics-batches.csv"',
    },
  });
}
