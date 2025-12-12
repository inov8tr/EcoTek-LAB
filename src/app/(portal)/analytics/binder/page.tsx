import AnalyticsTabs from "@/components/analytics/AnalyticsTabs";
import TestSetInlineCreatorClient from "@/components/analytics/test-sets/InlineCreatorClient";
import { cookies } from "next/headers";

function resolveBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export default async function BinderAnalyticsPage() {
  const baseUrl = resolveBaseUrl();
  const cookieHeader = cookies().toString();
  let sets: any[] = [];

  try {
    const res = await fetch(`${baseUrl}/api/analysis-sets/list`, {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });

    if (!res.ok) throw new Error(`Failed to load test sets (${res.status})`);

    const json = await res.json();
    sets = json.data ?? [];
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

  // If sets exist → show analytics tabs
  return <AnalyticsTabs initialSets={sets} />;
}
