export const pythonServiceBaseUrl =
  process.env.PY_SERVICE_URL || process.env.NEXT_PUBLIC_PY_SERVICE_URL || "http://localhost:10000";

export const pythonServicePort = Number(process.env.PY_SERVICE_PORT || process.env.PORT || "10000");

export const pythonServiceToken = process.env.PY_SERVICE_TOKEN;

export function buildPythonServiceUrl(path = "/"): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(pythonServiceBaseUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!url.port && localHosts.has(url.hostname)) {
    url.port = String(pythonServicePort);
  }
  url.pathname = `${url.pathname.replace(/\/$/, "")}${trimmed}`;
  return url.toString();
}

export async function getPythonStatus() {
  const url = process.env.OCR_API_URL;
  const apiKey = process.env.OCR_API_KEY;

  if (!url || !apiKey) {
    return {
      connected: false,
      message: "Set OCR_API_URL and OCR_API_KEY to enable Python service checks.",
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        image_url: "https://dummyimage.com/1x1/ffffff/000000&text=ping",
      }),
      // avoid caching a health response
      cache: "no-store",
    });

    if (!res.ok) {
      return { connected: false, message: `HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => null);
    const text = typeof data?.text === "string" ? data.text : null;

    return {
      connected: true,
      message: text ? "OCR online" : "OCR responded",
    };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
