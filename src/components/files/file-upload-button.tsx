"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useViewMode } from "@/context/view-mode-context";
import { Button } from "@/components/ui/button";

interface FileUploadButtonProps {
  target: "batch" | "test" | "binder_test";
  targetId: number | string;
  disabled?: boolean;
  uploadSection?: string;
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

export function FileUploadButton({ target, targetId, disabled, uploadSection }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { viewMode, allowSwitching } = useViewMode();
  const simulatedViewer = allowSwitching && viewMode === "VIEWER";
  const viewEnabled = !simulatedViewer;
  const finalDisabled = disabled || pending || !viewEnabled;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setPending(true);
    setError(null);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("owner_type", target === "batch" ? "batch" : "binder_test");
        formData.append("owner_id", String(targetId));
        if (uploadSection) {
          formData.append("upload_section", uploadSection);
        }
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          const text = await response.text().catch(() => "");
          let message = "Upload failed.";
          if (contentType.includes("application/json")) {
            const data = JSON.parse(text || "{}");
            message = data.error || data.message || message;
          } else if (text) {
            message = text;
          }
          throw new Error(message);
        }
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setPending(false);
      setIsDragging(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (finalDisabled) return;
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (finalDisabled) return;
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={finalDisabled}
        className="bg-primary text-white hover:bg-primaryHover disabled:opacity-60"
      >
        {pending ? "Uploading..." : "Upload documents"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES.join(",")}
        className="hidden"
        multiple
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center text-xs font-semibold transition ${
          finalDisabled
            ? "border-border text-[var(--color-text-muted)] opacity-60"
            : isDragging
            ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5 text-[var(--color-text-heading)]"
            : "border-border text-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
        }`}
      >
        Drag & drop files here or click the button above.
      </div>
      {!viewEnabled && (
        <p className="text-xs font-semibold text-[var(--color-text-muted)]">
          Uploads unavailable in Viewer Mode.
        </p>
      )}
      {error && <p className="text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
    </div>
  );
}
