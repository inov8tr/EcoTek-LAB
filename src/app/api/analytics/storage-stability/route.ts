import { NextResponse } from "next/server";
import {
  loadAnalyticsTestResults,
  extractVariableValue,
  extractStorageStabilityValue,
} from "@/lib/analytics/loaders";
import type { StorageStabilityMethod, VariableKey } from "@/types/analytics";
import { guardRequest, parseJsonBody } from "@/lib/api/guard";

export async function POST(req: Request) {
  const { errorResponse } = await guardRequest({ roles: ["ADMIN", "LAB", "VIEWER"] });
  if (errorResponse) return errorResponse;

  const { body, errorResponse: parseError } = await parseJsonBody<{
    testResultIds?: Array<string | number>;
    method: StorageStabilityMethod;
    variableKey: VariableKey;
  }>(req);

  if (parseError) return parseError;
  if (!body) {
    return NextResponse.json({ error: "Empty request body" }, { status: 400 });
  }

  const { testResultIds, method, variableKey } = body;

  if (!method || !variableKey) {
    return NextResponse.json({ error: "Missing method or variableKey" }, { status: 400 });
  }

  const results = await loadAnalyticsTestResults(testResultIds);

  if (!results.length) {
    return NextResponse.json({ data: [] });
  }

  const points = results
    .map((result) => {
      const x = extractVariableValue(result, variableKey as VariableKey);
      const y = extractStorageStabilityValue(result, method as StorageStabilityMethod);

      if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) {
        return null;
      }

      return {
        x,
        y,
        label: result.batch?.batchCode ?? String(result.id),
        testResultId: String(result.id),
      };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  return NextResponse.json({ data: points });
}
