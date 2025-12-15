"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ParseButtonClient({ binderTestId, disabled }: { binderTestId: string; disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function parseError(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(text || "{}");
        return json.error || json.detail || json.message || text || "Request failed";
      } catch {
        return text || "Request failed";
      }
    }
    return text || "Request failed";
  }

  async function handleParse() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/binder-tests/${binderTestId}/parse`, { method: "POST" });
      if (!res.ok) {
        const message = await parseError(res);
        setError(message || "Parse failed");
        return;
      }
      const text = await res.text().catch(() => "");
      try {
        const json = text ? JSON.parse(text) : {};
        if (json.status) setInfo(`Parse requested: ${json.status}`);
      } catch {
        /* ignore */
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={handleParse}
        disabled={disabled || pending}
        className="bg-primary text-white hover:bg-primaryHover disabled:opacity-60"
      >
        {pending ? "Parsing..." : disabled ? "Upload files first" : "Parse Binder Test"}
      </Button>
      {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
      {info && <p className="text-xs font-semibold text-[var(--color-text-muted)]">{info}</p>}
    </div>
  );
}

export function ConfirmButtonClient({ binderTestId }: { binderTestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function parseError(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(text || "{}");
        return json.error || json.detail || json.message || text || "Request failed";
      } catch {
        return text || "Request failed";
      }
    }
    return text || "Request failed";
  }

  async function handleConfirm() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/binder-tests/${binderTestId}/confirm`, { method: "POST" });
      if (!res.ok) {
        const message = await parseError(res);
        setError(message || "Confirm failed");
        return;
      }
      const text = await res.text().catch(() => "");
      try {
        const json = text ? JSON.parse(text) : {};
        if (json.status) setInfo(`Status: ${json.status}`);
      } catch {
        /* ignore */
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={handleConfirm}
        disabled={pending}
        className="bg-primary text-white hover:bg-primaryHover disabled:opacity-60"
      >
        {pending ? "Confirming..." : "Confirm Binder Test"}
      </Button>
      {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
      {info && <p className="text-xs font-semibold text-[var(--color-text-muted)]">{info}</p>}
    </div>
  );
}
