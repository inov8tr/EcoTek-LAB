"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useViewMode } from "@/context/view-mode-context";

interface FileUploadButtonProps {
  target: "batch" | "test";
  targetId: number;
  disabled?: boolean;
}

const ACCEPT_TYPES = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
];

export function FileUploadButton({ target, targetId, disabled }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { viewMode, allowSwitching } = useViewMode();
  const simulatedViewer = allowSwitching && viewMode === "VIEWER";
  const viewEnabled = !simulatedViewer;
  const finalDisabled = disabled || pending || !viewEnabled;

  const endpoint = target === "batch" ? "/api/uploads/batch" : "/api/uploads/test";

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append(target === "batch" ? "batchId" : "testId", String(targetId));
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    setPending(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="rounded-full bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={finalDisabled}
      >
        {pending ? "Uploading..." : "Upload document"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES.join(",")}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {!viewEnabled && (
        <p className="text-xs font-semibold text-[var(--color-text-muted)]">
          Uploads unavailable in Viewer Mode.
        </p>
      )}
      {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
    </div>
  );
}
