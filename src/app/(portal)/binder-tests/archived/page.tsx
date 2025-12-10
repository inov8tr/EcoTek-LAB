import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { ActionsMenu } from "@/components/binder-tests/ActionsMenu";
import { StatusBadge } from "@/components/ui/status-badge";
import { evaluateBinderRules } from "@/lib/binder/rules";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(date);
}

export default async function ArchivedBinderTestsPage() {
  const currentUser = await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  const tests = await prisma.binderTest.findMany({
    where: { archived: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Archived Binder Tests</h1>
          <p className="text-sm text-muted-foreground">View archived binder test runs. Restore to make them active again.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={"/binder-tests" as Route}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to active
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-[#E3E8EF] bg-[#FFFFFF] p-4">
        {tests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived binder tests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-[#F2F4F7] text-[#667085]">
                <tr className="text-xs uppercase tracking-wide">
                  <th className="py-2 pr-4 text-left font-semibold border-b border-[#E3E8EF]">Test Name</th>
                  <th className="py-2 px-4 text-left font-semibold border-b border-[#E3E8EF]">Batch</th>
                  <th className="py-2 px-4 text-left font-semibold border-b border-[#E3E8EF]">Binder Source</th>
                  <th className="py-2 px-4 text-left font-semibold border-b border-[#E3E8EF]">CRM / Reagent / Aerosil</th>
                  <th className="py-2 px-4 text-left font-semibold border-b border-[#E3E8EF]">Status</th>
                  <th className="py-2 px-4 text-left font-semibold border-b border-[#E3E8EF]">Created</th>
                  <th className="py-2 pl-4 text-right font-semibold border-b border-[#E3E8EF]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => {
                  const qa = evaluateBinderRules({
                    recoveryPct: test.recoveryPct,
                    softeningPoint: test.softeningPointC,
                    pgHigh: test.pgHigh,
                    pgLow: test.pgLow,
                    crmPct: test.crmPct,
                    reagentPct: test.reagentPct,
                    aerosilPct: test.aerosilPct,
                  });
                  return (
                    <tr key={test.id} className="border-b border-[#E3E8EF] bg-[#FFFFFF] transition-colors hover:bg-[#F6F7FA] last:border-0">
                      <td className="py-2 pr-4">
                        <Link href={`/binder-tests/${test.id}` as Route} className="font-medium text-primary hover:underline">
                          {test.name}
                        </Link>
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Archived
                        </span>
                      </td>
                      <td className="py-2 px-4 text-[#2E2F31]">{test.batchId ?? "-"}</td>
                      <td className="py-2 px-4 text-[#2E2F31]">{test.binderSource ?? "-"}</td>
                      <td className="py-2 px-4 text-[#667085]">
                        <span className="text-xs">
                          CRM: {test.crmPct ?? "-"}% · Reagent: {test.reagentPct ?? "-"}% · Aerosil: {test.aerosilPct ?? "-"}%
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="space-y-1">
                          <StatusBadge
                            status={test.status ?? qa.overall}
                            label={(test.status ?? qa.overall).toString().replace(/_/g, " ").toLowerCase()}
                          />
                          <StatusBadge variant="neutral" label={`QA: ${qa.overall} | Rating: ${qa.rating}`} />
                        </div>
                      </td>
                      <td className="py-2 px-4 text-xs text-[#667085]">{formatDate(test.createdAt)}</td>
                      <td className="py-2 pl-4 text-right">
                        <ActionsMenu id={test.id} archived={test.archived} isAdmin={currentUser.role === UserRole.ADMIN} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
