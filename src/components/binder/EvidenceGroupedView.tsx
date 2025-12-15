"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";

type EvidenceFile = {
  id: string;
  fileName: string;
  mimeType: string | null;
  size?: number | null;
  url: string;
  createdAt: string;
  uploadSection?: string | null;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
  uploadedAfterFinalization?: boolean;
};

type Props = {
  files: EvidenceFile[];
  latestSummaryCreatedAt: number | null;
  showData?: boolean;
  showImages?: boolean;
  showVideo?: boolean;
  showSupporting?: boolean;
};

export function EvidenceGroupedView({
  files,
  latestSummaryCreatedAt,
  showData = true,
  showImages = true,
  showVideo = true,
  showSupporting = true,
}: Props) {
  const [filters, setFilters] = useState({
    DATA: showData,
    IMAGES: showImages,
    VIDEO: showVideo,
    SUPPORTING: showSupporting,
  });

  const grouped = useMemo(() => {
    const buckets: Record<string, EvidenceFile[]> = { DATA: [], IMAGES: [], VIDEO: [], SUPPORTING: [] };
    for (const f of files) {
      const section = normalizeSection(f);
      buckets[section].push(f);
    }
    return buckets;
  }, [files]);

  const categories: { key: keyof typeof grouped; label: string }[] = [
    { key: "DATA", label: "DATA FILES" },
    { key: "IMAGES", label: "IMAGES" },
    { key: "VIDEO", label: "VIDEO" },
    { key: "SUPPORTING", label: "SUPPORTING FILES" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filters[c.key]
                ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-text-heading)]"
                : "border-border text-[var(--color-text-muted)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {categories.map((c) => {
        const list = grouped[c.key] || [];
        if (list.length === 0 || !filters[c.key]) return null;
        return (
          <div key={c.key} className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--color-text-heading)]">{c.label}</h4>
            <div className="divide-y divide-border rounded-lg border border-border-subtle bg-white/70">
              {list.map((f) => {
                const uploadedAt = f.uploadedAt ?? f.createdAt;
                const uploadedAfterFinalization =
                  f.uploadedAfterFinalization ||
                  (latestSummaryCreatedAt !== null && new Date(uploadedAt).getTime() > latestSummaryCreatedAt);
                return (
                  <div key={f.id} className="grid gap-2 px-3 py-2 text-sm md:grid-cols-[2fr_1fr_1fr_auto]">
                    <div>
                      <p className="font-semibold text-[var(--color-text-heading)]">{f.fileName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <Badge variant="secondary">{c.key}</Badge>
                        {uploadedAfterFinalization && <Badge variant="destructive">Uploaded after finalization</Badge>}
                        <span>{f.mimeType ?? "Unknown type"}</span>
                        {f.size ? <span>{formatBytes(f.size)}</span> : null}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Uploaded by {f.uploadedBy ?? "—"}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">{new Date(uploadedAt).toLocaleString()}</div>
                    <div className="flex items-center justify-end">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-text-link)] underline underline-offset-2"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function normalizeSection(file: EvidenceFile): keyof ReturnType<typeof buildSectionMap> {
  const section = (file.uploadSection || "").toUpperCase();
  if (section.includes("DATA")) return "DATA";
  if (section.includes("IMAGE")) return "IMAGES";
  if (section.includes("VIDEO")) return "VIDEO";
  if (section.includes("SUPPORT")) return "SUPPORTING";
  const mime = (file.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "IMAGES";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DATA";
}

function buildSectionMap() {
  return { DATA: [], IMAGES: [], VIDEO: [], SUPPORTING: [] as EvidenceFile[] };
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${units[idx]}`;
}
