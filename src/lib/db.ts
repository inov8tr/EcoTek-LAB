import { dbApi } from "@/lib/dbApi";

export async function getDatabaseStatus() {
  try {
    await dbApi("/health/schema");
    return { connected: true, message: "API reachable" };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : "API unreachable",
    };
  }
}
