export async function callPython(path: string, payload: any) {
  const base = process.env.PYTHON_API_URL ?? "";
  if (!base) {
    throw new Error("PYTHON_API_URL is not configured");
  }
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Python service error: ${res.status}`);
  }

  return res.json();
}
