export async function pythonClient(endpoint: string, payload: any) {
  const url = process.env.PYTHON_SERVICE_URL;

  if (!url) {
    throw new Error("Python service is not configured yet");
  }

  const res = await fetch(`${url}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Python service error: " + res.status);
  }

  return res.json();
}
