export async function dbApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.DB_API_URL;
  const apiKey = process.env.DB_API_KEY || process.env.X_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("DB_API_URL/DB_API_KEY must be configured");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`DB API error ${res.status}`);
  }

  return res.json();
}
