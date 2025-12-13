import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image_url" },
        { status: 400 }
      );
    }

    const res = await fetch(process.env.OCR_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.OCR_API_KEY!,
      },
      body: JSON.stringify({ image_url }),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("OCR proxy error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
