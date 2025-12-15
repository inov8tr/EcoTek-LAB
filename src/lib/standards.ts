import { dbQuery } from "./db-proxy";

export const PRIMARY_STANDARD_CODE = "KR_PG82_22";

type Standard = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  marketId: number | null;
};

type StandardRequirement = {
  id: number;
  standardId: number;
  metric: string;
  comparison: string;
  thresholdMin: number | null;
  thresholdMax: number | null;
  unit: string | null;
  notes: string | null;
};

let cachedStandard: (Standard & { requirements: StandardRequirement[] }) | null = null;

export async function getPrimaryStandard() {
  if (cachedStandard) return cachedStandard;
  const [standard] = await dbQuery<Standard>(
    'SELECT "id", "code", "name", "description", "marketId" FROM "Standard" WHERE "code" = $1 LIMIT 1',
    [PRIMARY_STANDARD_CODE],
  );
  if (!standard) {
    cachedStandard = {
      id: -1,
      code: PRIMARY_STANDARD_CODE,
      name: "Default Standard",
      description: null,
      marketId: null,
      requirements: [],
    };
    return cachedStandard;
  }
  const requirements = await dbQuery<StandardRequirement>(
    'SELECT "id", "standardId", "metric", "comparison", "thresholdMin", "thresholdMax", "unit", "notes" FROM "StandardRequirement" WHERE "standardId" = $1',
    [standard.id],
  );
  cachedStandard = { ...standard, requirements };
  return cachedStandard;
}
