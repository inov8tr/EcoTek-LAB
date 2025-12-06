import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") === "archived" ? "archived" : "active";
  const batches = await prisma.batch.findMany({
    where: { archived: view === "archived" },
    orderBy: { dateMixed: "desc" },
    include: { formulation: true },
  });

  const header = ["id", "batchCode", "formula", "dateMixed", "operator", "status", "archived"];
  const rows = batches.map((b) =>
    [
      b.id,
      b.batchCode,
      b.formulation?.code ?? "",
      b.dateMixed.toISOString(),
      b.operator ?? "",
      b.status ?? "",
      b.archived ? "yes" : "no",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="batches-${view}.csv"`,
    },
  });
}
