import AnalyticsTabs from "@/components/analytics/AnalyticsTabs";
import TestSetInlineCreatorClient from "@/components/analytics/test-sets/InlineCreatorClient";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function BinderAnalyticsPage({
  searchParams,
}: {
  searchParams: { setId?: string };
}) {
  let sets: any[] = [];

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const where =
      user.role === "ADMIN"
        ? undefined
        : {
            OR: [{ ownerId: user.id }, { ownerId: null }],
          };

    sets = await prisma.analysisSet.findMany({ where, orderBy: { createdAt: "desc" } });
  } catch (err) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-10">
        <h1 className="text-2xl font-semibold">Unable to load analytics</h1>
        <p className="text-neutral-600">{(err as Error).message ?? "Unknown error"}</p>
        <TestSetInlineCreatorClient />
        <a href="/analytics/test-sets" className="text-sm text-brand-primary underline">
          Manage Test Sets →
        </a>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-10">
        <h1 className="text-2xl font-semibold">No Test Sets Found</h1>
        <p className="text-neutral-600">
          Before running analytics, create a Test Set from your existing binder tests.
        </p>

        <TestSetInlineCreatorClient />

        <a href="/analytics/test-sets" className="text-sm text-brand-primary underline">
          Manage Test Sets →
        </a>
      </div>
    );
  }

  const initialSetId = searchParams?.setId ?? sets[0]?.id ?? null;

  // If sets exist → show analytics tabs, with manage link to dedicated page
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <a href="/analytics/test-sets" className="text-sm text-brand-primary underline">
          Create / Manage Test Sets
        </a>
      </div>
      <AnalyticsTabs initialSets={sets} initialTestSetId={initialSetId} />
    </div>
  );
}
