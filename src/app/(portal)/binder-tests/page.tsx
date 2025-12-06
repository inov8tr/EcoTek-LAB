import Link from "next/link";
import type { Route } from "next";
import { BinderTestStatus, UserRole } from "@prisma/client";
import { PlusCircle, FlaskConical, Filter, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionsMenu } from "@/components/binder-tests/ActionsMenu";
import { EmptyState } from "@/components/ui/empty-state";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(date);
}

type BinderTestsPageProps = {
  searchParams?: {
    q?: string;
    status?: BinderTestStatus;
  };
};

export default async function BinderTestsPage({ searchParams }: BinderTestsPageProps) {
  const currentUser = await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  const q = searchParams?.q?.toString() ?? "";
  const statusFilter = searchParams?.status;

  const where = {
    AND: [
      q
        ? {
            name: {
              contains: q,
              mode: "insensitive",
            },
          }
        : {},
      statusFilter ? { status: statusFilter } : {},
    ],
  };

  const tests = await prisma.binderTest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const canCreate = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.RESEARCHER;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Binder Test Data</h1>
          <p className="text-sm text-muted-foreground">View and manage binder test runs, reports, photos, and videos.</p>
        </div>
        {canCreate && (
          <Link href={"/binder-tests/new" as Route}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Binder Test
            </Button>
          </Link>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form className="flex flex-wrap items-center gap-3" method="get">
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                name="q"
                placeholder="Search name"
                defaultValue={q}
                className="w-48 text-sm outline-none"
              />
            </div>
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {Object.values(BinderTestStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              Apply
            </Button>
            {(q || statusFilter) && (
              <Link href={"/binder-tests" as Route} className="text-sm text-muted-foreground hover:text-primary">
                Clear
              </Link>
            )}
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href={"/api/binder-tests/export" as Route}>
              <Button variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </Link>
          </div>
        </div>
        {tests.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-6 w-6" />}
            title="No binder tests yet"
            description="Create your first binder test to start tracking results, documents, and extractions."
            actions={
              canCreate && (
                <Link href={"/binder-tests/new" as Route}>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Binder Test
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-4 text-left">Test Name</th>
                  <th className="py-2 px-4 text-left">Batch</th>
                  <th className="py-2 px-4 text-left">Binder Source</th>
                  <th className="py-2 px-4 text-left">CRM / Reagent / Aerosil</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Created</th>
                  <th className="py-2 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-4">
                      <Link href={`/binder-tests/${test.id}` as Route} className="font-medium text-primary hover:underline">
                        {test.name}
                      </Link>
                    </td>
                    <td className="py-2 px-4">{test.batchId ?? "-"}</td>
                    <td className="py-2 px-4">{test.binderSource ?? "-"}</td>
                    <td className="py-2 px-4">
                      <span className="text-xs text-muted-foreground">
                        CRM: {test.crmPct ?? "-"}% · Reagent: {test.reagentPct ?? "-"}% · Aerosil: {test.aerosilPct ?? "-"}%
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant="outline">{test.status}</Badge>
                    </td>
                    <td className="py-2 px-4 text-xs text-muted-foreground">{formatDate(test.createdAt)}</td>
                    <td className="py-2 pl-4 text-right">
                      <ActionsMenu id={test.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
