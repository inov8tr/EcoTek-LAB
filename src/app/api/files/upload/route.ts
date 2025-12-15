import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { DB_API_URL, DB_API_KEY, X_API_KEY } = process.env;
  const apiKey = DB_API_KEY || X_API_KEY;

  if (!DB_API_URL || !apiKey) {
    return NextResponse.json(
      { error: "DB_API_URL or DB_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const ownerType = formData.get("owner_type")?.toString();
    const ownerId = formData.get("owner_id")?.toString();

    if (ownerType === "binder_test" && ownerId) {
      await ensureBinderTestData(DB_API_URL, apiKey, ownerId);
    }

    const upstream = await fetch(`${DB_API_URL}/files/upload`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const isJson = contentType.includes("application/json");

    if (!upstream.ok) {
      let payload: any = { error: "Upload failed", status: upstream.status, message: text };
      if (isJson) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { error: text || "Upload failed", status: upstream.status };
        }
      } else if (text) {
        payload = { error: text, status: upstream.status };
      }
      return NextResponse.json(payload, { status: upstream.status });
    }

    if (isJson) {
      try {
        return NextResponse.json(JSON.parse(text), { status: upstream.status });
      } catch {
        // fall through to plain text response
      }
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType || "text/plain" },
    });
  } catch (err: any) {
    console.error("Upload proxy error", err);
    const message = err?.message || "Upload proxy failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function ensureBinderTestData(baseUrl: string, apiKey: string, binderTestId: string) {
  const safeId = binderTestId.replace(/'/g, "''");
  // Check if BinderTestData row exists
  const existsPayload = {
    query: `SELECT 1 FROM "BinderTestData" WHERE "id"='${safeId}' LIMIT 1`,
  };
  const existsRes = await fetch(`${baseUrl}/db/query`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(existsPayload),
  });
  const existsJson = await existsRes.json().catch(() => ({}));
  const alreadyExists = Array.isArray(existsJson.rows) && existsJson.rows.length > 0;
  if (alreadyExists) return;

  // Insert minimal BinderTestData row so file FK passes
  const insertPayload = {
    query: [
      'INSERT INTO "BinderTestData" ("id","testName","status","createdAt")',
      `VALUES ('${safeId}',`,
      `COALESCE((SELECT "testName" FROM "BinderTest" WHERE "id"='${safeId}' LIMIT 1),'binder-test'),`,
      `'REVIEW_REQUIRED', NOW())`,
    ].join(" "),
  };
  const insertRes = await fetch(`${baseUrl}/db/query`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(insertPayload),
  });
  if (!insertRes.ok) {
    const msg = await insertRes.text().catch(() => "Failed to prepare binder test data row");
    throw new Error(msg);
  }
}
