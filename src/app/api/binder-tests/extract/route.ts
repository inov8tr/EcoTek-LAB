import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF text
    const pdfModule = await import("pdf-parse");
    const pdf = (pdfModule as any).default ?? pdfModule;
    const parsed = await pdf(buffer);
    const text = parsed.text;

    // Extract binder test values
    const extracted = extractBinderValues(text);

    return NextResponse.json({ ok: true, data: extracted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// -------- Extraction Logic --------

function matchNumber(text: string, regex: RegExp): number | null {
  const match = text.match(regex);
  if (!match) return null;
  const num = parseFloat(match[match.length - 1]);
  return Number.isFinite(num) ? num : null;
}

function extractBinderValues(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();

  // PG
  const pgHigh = matchNumber(clean, /PG\s*([0-9]{2})\s*-/i);
  const pgLow = matchNumber(clean, /PG\s*[0-9]{2}\s*-\s*(-?[0-9]{2})/i);

  // Storage stability (Softening Top/Bottom)
  const softeningTop = matchNumber(clean, /(Top|Upper).*?([0-9]{2,3}\.?[0-9]*)\s*C/i);
  const softeningBottom = matchNumber(clean, /(Bottom|Lower).*?([0-9]{2,3}\.?[0-9]*)\s*C/i);

  const deltaSoftening =
    softeningTop !== null && softeningBottom !== null
      ? Number((softeningTop - softeningBottom).toFixed(2))
      : null;

  // Viscosity
  const viscosity135 = matchNumber(clean, /(Viscosity|135).*?([0-9]{2,4})\s*c?p?/i);

  // Softening point
  const softeningPoint = matchNumber(clean, /Softening Point.*?([0-9]{2,3}\.?[0-9]*)/i);

  // Ductility
  const ductility15 = matchNumber(clean, /Ductility.*?15.*?([0-9]{2,3})\s*cm/i);
  const ductility25 = matchNumber(clean, /Ductility.*?25.*?([0-9]{2,3})\s*cm/i);

  // Elastic Recovery
  const recovery = matchNumber(clean, /(Recovery|Elastic).*?([0-9]{2,3})\s*%/i);

  // Jnr
  const jnr = matchNumber(clean, /Jnr.*?([0-9]\.?[0-9]*)/i);

  // Solubility
  const solubility = matchNumber(clean, /Solubility.*?([0-9]{2,3})\s*%/i);

  return {
    pgHigh,
    pgLow,
    softeningTop,
    softeningBottom,
    deltaSoftening,
    viscosity135,
    softeningPoint,
    ductility15,
    ductility25,
    recovery,
    jnr,
    solubility,
  };
}
