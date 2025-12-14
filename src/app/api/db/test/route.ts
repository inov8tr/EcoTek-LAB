import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { DB_API_URL, DB_API_KEY } = process.env;
  if (!DB_API_URL || !DB_API_KEY) {
    return NextResponse.json(
      { error: "DB_API_URL or DB_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(`${DB_API_URL}/db/test`, {
    headers: { "x-api-key": DB_API_KEY },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "DB test endpoint returned an error", status: res.status },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
