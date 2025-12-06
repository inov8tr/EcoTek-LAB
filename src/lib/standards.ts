import type { Standard, StandardRequirement } from "@prisma/client";
import { prisma } from "./prisma";

export const PRIMARY_STANDARD_CODE = "KR_PG82_22";

let cachedStandard: (Standard & { requirements: StandardRequirement[] }) | null = null;

export async function getPrimaryStandard() {
  if (cachedStandard) return cachedStandard;
  const standard = await prisma.standard.findUnique({
    where: { code: PRIMARY_STANDARD_CODE },
    include: { requirements: true },
  });
  if (!standard) {
    throw new Error(`Standard ${PRIMARY_STANDARD_CODE} is not defined.`);
  }
  cachedStandard = standard;
  return standard;
}
