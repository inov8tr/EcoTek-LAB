import { prisma } from "@/lib/prisma";
import TestSetManager from "@/components/analytics/test-sets/TestSetManager";

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
            Create or pick a test set, then jump into analytics.
          </p>
        </div>
      </div>

      <TestSetManager initialSets={sets as any} />
    </div>
  );
}
