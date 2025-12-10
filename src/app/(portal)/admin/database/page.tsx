import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { TableBrowser } from "@/components/admin/database/TableBrowser";

export default async function AdminDatabasePage() {
  await requireRole([UserRole.ADMIN]);

  const tables =
    await prisma.$queryRaw<{ table_name: string }[]>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Database tables</h1>
        <p className="text-[var(--color-text-muted)]">Browse public schema tables. Reads only.</p>
      </div>

      <TableBrowser tables={tables.map((t) => t.table_name)} />
    </div>
  );
}
