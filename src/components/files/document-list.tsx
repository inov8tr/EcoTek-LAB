"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteRequestModal } from "./delete-request-modal";
import { formatDate } from "@/lib/utils";
import { useViewMode } from "@/context/view-mode-context";

export interface AttachmentItem {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploader?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface DocumentListProps {
  attachments: AttachmentItem[];
  canDelete: boolean;
  canDownload: boolean;
  allowRequests: boolean;
  requestTargetTable: string;
}

export function DocumentList({
  attachments,
  canDelete,
  canDownload,
  allowRequests,
  requestTargetTable,
}: DocumentListProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { viewMode, allowSwitching } = useViewMode();
  const simulatedViewer = allowSwitching && viewMode === "VIEWER";
  const viewAllowsDownloads = canDownload && !simulatedViewer;
  const viewAllowsRequests = allowRequests && (!simulatedViewer);
  const viewAllowsDelete = canDelete && (allowSwitching ? viewMode === "ADMIN" : true);

  async function deleteAttachment(id: number) {
    startTransition(async () => {
      const response = await fetch("/api/uploads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId: id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Unable to delete file.");
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No attachments uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex flex-col gap-2 rounded-2xl border border-border bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
          role="group"
          aria-label={`Attachment ${attachment.fileName}`}
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-heading)]">{attachment.fileName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {formatBytes(attachment.size)} · {attachment.mimeType} · Uploaded{" "}
              {formatDate(new Date(attachment.createdAt))}
            </p>
            {attachment.uploader && (
              <p className="text-xs text-[var(--color-text-muted)]">
                by {attachment.uploader.name ?? attachment.uploader.email ?? "Unknown"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={viewAllowsDownloads ? attachment.url : undefined}
              target="_blank"
              rel="noreferrer"
              className={`text-xs font-semibold ${
                viewAllowsDownloads
                  ? "text-[var(--color-text-link)] underline-offset-4 hover:underline"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {viewAllowsDownloads ? "Download" : "Download disabled"}
            </a>
            {viewAllowsRequests && (
              <DeleteRequestModal
                targetTable={requestTargetTable}
                targetId={attachment.id}
                triggerLabel="Request deletion"
              />
            )}
            {viewAllowsDelete && (
              <button
                type="button"
                onClick={() => deleteAttachment(attachment.id)}
                className="text-xs font-semibold text-[var(--color-status-fail-text)] hover:underline disabled:opacity-60"
                disabled={isPending}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
      {error && <p className="text-sm font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}
