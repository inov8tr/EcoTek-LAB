import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { table: string } }
) {
  const tableParam = decodeURIComponent(params.table);
  const tables =
    await prisma.$queryRaw<{ table_name: string }[]>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  const tableNames = new Set(tables.map((t) => t.table_name));
  if (!tableNames.has(tableParam)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const columns =
    await prisma.$queryRaw<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${tableParam} ORDER BY ordinal_position`;
  if (!columns.length) {
    return new NextResponse("No columns", { status: 404 });
  }

  const tableIdentifier = Prisma.raw(`"${tableParam}"`);
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`SELECT * FROM ${tableIdentifier}`);
  const header = columns.map((c) => c.column_name);
  const csvRows = rows.map((row) =>
    header
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        const asString = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${asString.replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  const csv = [header.join(","), ...csvRows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${tableParam}.csv"`,
    },
  });
}
