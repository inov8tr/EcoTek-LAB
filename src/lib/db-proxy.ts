import { dbApi } from "./dbApi";

export async function dbQuery<T = any>(sql: string, params: unknown[] = []) {
  const data = await dbApi<{ ok: boolean; rows: T[] }>("/db/query", {
    method: "POST",
    body: JSON.stringify({ query: sql, params }),
  });
  return data.rows;
}
