import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionsMenu } from "@/components/binder-tests/ActionsMenu";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(date);
}

export default async function BinderTestsPage() {
  const currentUser = await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  const tests = await prisma.binderTest.findMany({
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
        {tests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No binder tests yet. Create your first test to begin tracking results.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
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
                  <tr key={test.id} className="border-b last:border-0">
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
