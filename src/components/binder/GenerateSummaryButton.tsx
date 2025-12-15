"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  binderTestId: string;
  disabled?: boolean;
};

export function GenerateSummaryButton({ binderTestId, disabled }: Props) {
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

  const handleGenerate = () => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/binder-tests/${binderTestId}/summaries`, { method: "POST" });
        const text = await res.text().catch(() => "");
        if (!res.ok) {
          const message = await parseError(res);
          setError(message || "Failed to generate summary");
          return;
        }
        const json = text ? JSON.parse(text) : {};
        if (json?.doiLikeId) setInfo(`Created ${json.doiLikeId}`);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || "Failed to generate summary");
      }
    });
  };

  return (
    <div className="space-y-1">
      <Button onClick={handleGenerate} disabled={disabled || pending} className="bg-primary text-white hover:bg-primaryHover">
        {pending ? "Generating..." : "Generate Final Summary"}
      </Button>
      {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
      {info && <p className="text-xs font-semibold text-[var(--color-text-muted)]">{info}</p>}
    </div>
  );
}
