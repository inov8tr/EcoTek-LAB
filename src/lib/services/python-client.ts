import { buildPythonServiceUrl, pythonServiceToken } from "@/lib/services/python";

type PgRequestPayload = {
  temps: number[];
  gstar_original: number[];
  gstar_rtfo: number[];
};

type PgResponsePayload = {
  pg_high?: number;
};

export async function getPythonServiceHealth(): Promise<boolean> {
  const url = buildPythonServiceUrl("/health");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data?.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function pythonRequest<TPayload, TResponse>(
  path: string,
  payload: TPayload,
  options?: RequestInit
): Promise<TResponse> {
  const url = buildPythonServiceUrl(path);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (pythonServiceToken) {
    headers.Authorization = `Bearer ${pythonServiceToken}`;
  }

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
        ...options,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Python service error ${res.status}: ${text}`);
      }
      return (await res.json()) as TResponse;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Python service request failed");
}

export async function computePgGrade(payload: PgRequestPayload): Promise<PgResponsePayload> {
  return pythonRequest<PgRequestPayload, PgResponsePayload>("/compute/pg", payload);
}
