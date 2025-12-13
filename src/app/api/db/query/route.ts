import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { DB_API_URL, X_API_KEY } = process.env;
  if (!DB_API_URL || !X_API_KEY) {
    return NextResponse.json(
      { error: "DB_API_URL or X_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const body = await req.json();

  const res = await fetch(`${DB_API_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": X_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "DB query endpoint returned an error", status: res.status },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
