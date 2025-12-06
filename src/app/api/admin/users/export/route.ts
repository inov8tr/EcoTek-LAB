import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = (searchParams.get("status") ?? "").toUpperCase();
  const roleParam = (searchParams.get("role") ?? "").toUpperCase();
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {};
  if (statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)) {
    where.status = statusParam as UserStatus;
  }
  if (roleParam && Object.values(UserRole).includes(roleParam as UserRole)) {
    where.role = roleParam as UserRole;
  }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const header = ["id", "email", "name", "role", "status", "createdAt"];
  const rows = users.map((u) =>
    [
      u.id,
      u.email,
      u.name,
      u.role,
      u.status,
      u.createdAt.toISOString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="users.csv"',
    },
  });
}
