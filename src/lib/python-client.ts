export async function runPython(endpoint: string, payload: any) {
  const res = await fetch(`/api/python/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Python function error: ${res.status}`);
  }

  return await res.json();
}
