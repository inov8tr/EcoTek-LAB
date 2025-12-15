import assert from "node:assert/strict";

const baseUrl = process.env.DB_API_URL;
const apiKey = process.env.DB_API_KEY;

async function api(path: string, init: RequestInit = {}) {
  if (!baseUrl || !apiKey) {
    throw new Error("DB_API_URL or DB_API_KEY is missing");
  }
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Smoke check failed ${path}: ${res.status} ${text}`);
  }
  return res;
}

async function main() {
  // Health
  await api("/health/schema").then((r) => r.json());

  // Minimal table probes via /db/query
  const probes = [
    'SELECT "id" FROM "User" LIMIT 1',
    'SELECT "id" FROM "CapsuleFormula" LIMIT 1',
    'SELECT "id" FROM "PmaFormula" LIMIT 1',
  ];

  for (const query of probes) {
    const res = await api("/db/query", {
      method: "POST",
      body: JSON.stringify({ query }),
    }).then((r) => r.json());
    assert.ok(res.ok === true, `Probe failed for query: ${query}`);
  }

  console.log("Schema smoke: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
