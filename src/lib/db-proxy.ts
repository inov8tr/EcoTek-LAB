export async function dbQuery<T = any>(sql: string, params: unknown[] = []) {
  const baseUrl = process.env.DB_API_URL;
  if (!baseUrl) {
    throw new Error("DB_API_URL is not set");
  }

  const res = await fetch(`${baseUrl}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.X_API_KEY as string,
    },
    body: JSON.stringify({ query: sql, params }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dbQuery failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { ok: boolean; rows: T[] };
  return data.rows;
}
