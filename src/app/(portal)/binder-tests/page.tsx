export const runtime = "nodejs";

import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { dbApi } from "@/lib/dbApi";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateBinderTestModal } from "@/components/binder/CreateBinderTestModal";

type BinderTestListItem = {
  id: string;
  pmaTestBatchCode?: string | null;
  status: string;
  updatedAt: string;
};

export default async function BinderTestsPage() {
  const tests = await loadTests();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Binder Tests</h1>
          <p className="text-[var(--color-text-muted)]">Manage binder evaluations and evidence.</p>
        </div>
        <ViewModeGate minRole="RESEARCHER">
          <CreateBinderTestModal />
        </ViewModeGate>
      </div>

      {tests.length === 0 ? (
        <EmptyState
          title="No binder tests yet"
          description="Create a binder test to start uploading evidence and parsing metrics."
          actions={
            <ViewModeGate minRole="RESEARCHER">
              <CreateBinderTestModal compact />
            </ViewModeGate>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <DashboardCard
              key={test.id}
              title={`Binder Test ${test.id.slice(0, 8)}`}
              description={test.binderFormulation || "No formulation provided."}
              footer={
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>{test.status}</span>
                  <Link href={`/binder-tests/${test.id}` as Route} className="font-semibold text-[var(--color-text-link)]">
                    Open
                  </Link>
                </div>
              }
            >
              <p className="text-sm text-[var(--color-text-main)]">
                PMA Batch: {test.pmaTestBatchCode ?? "N/A"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Updated: {new Date(test.updatedAt).toLocaleString()}</p>
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}

async function loadTests(): Promise<BinderTestListItem[]> {
  try {
    return await dbApi<BinderTestListItem[]>("/db/binder-tests");
  } catch (err) {
    console.error("Failed to load binder tests", err);
    return [];
  }
}
