"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "archive" | "restore";

export function ArchiveOriginButton({ originId, mode = "archive" }: { originId: string; mode?: Mode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const endpoint =
          mode === "archive"
            ? `/api/bitumen/origins/${originId}/archive`
            : `/api/bitumen/origins/${originId}/restore`;
        const res = await fetch(endpoint, { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || (mode === "archive" ? "Unable to archive origin" : "Unable to restore origin"));
        }
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? (mode === "archive" ? "Unable to archive origin" : "Unable to restore origin"));
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        disabled={pending}
        className="px-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]"
      >
        {pending ? (mode === "archive" ? "Archiving..." : "Restoring...") : mode === "archive" ? "Archive" : "Restore"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
