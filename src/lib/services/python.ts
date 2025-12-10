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
