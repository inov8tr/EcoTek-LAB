import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TestSetsPage() {
  const sets = await prisma.analysisSet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tests: true,
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Test Sets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your saved collections of test results for analytics.
          </p>
        </div>
        <Link
          href="/analytics/binder"
          className="text-sm text-brand-primary underline"
        >
          Back to Analytics
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sets.map((set) => (
          <div key={set.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{set.name}</h2>
                {set.description && (
                  <p className="text-sm text-neutral-600">{set.description}</p>
                )}
              </div>
              <span className="text-xs text-neutral-500">
                {set.tests.length} tests
              </span>
            </div>
          </div>
        ))}

        {sets.length === 0 && (
          <div className="rounded-lg border bg-white p-4 text-sm text-neutral-600">
            No test sets yet. Create one from the Binder Analytics page.
          </div>
        )}
      </div>
    </div>
  );
}
