"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

export function AdditionalFilesUploader({ binderTestId }: { binderTestId: string }) {
  const [show, setShow] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  async function handleUpload() {
    if (!files.length) {
      setShow(false);
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    try {
      const res = await fetch(`/api/binder-tests/${binderTestId}/files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        console.error("Failed to append files", await res.text());
      } else {
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
      setShow(false);
      setFiles([]);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={() => setShow(true)}>
        Add more files
      </Button>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Add files</h3>
              <Button variant="ghost" onClick={() => setShow(false)}>
                Close
              </Button>
            </div>
            <div
              className={`mt-2 rounded-2xl border-2 border-dashed p-8 text-center transition ${
                dragActive ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5" : "border-border-subtle"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFiles(e.dataTransfer.files);
              }}
            >
              <p className="text-sm text-[var(--color-text-heading)]">Drag & drop PDFs, images, or videos here</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">or</p>
              <div className="mt-3 flex justify-center">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Browse files
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*,video/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {files.length > 0 && (
                <div className="mt-4 text-left text-xs text-[var(--color-text-muted)] max-h-32 overflow-y-auto">
                  <p className="font-semibold text-[var(--color-text-heading)] text-sm mb-1">Selected files:</p>
                  <ul className="space-y-1">
                    {files.map((f, idx) => (
                      <li key={`${f.name}-${idx}`} className="truncate">
                        {f.name} ({Math.round(f.size / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShow(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={submitting || files.length === 0}>
                {submitting ? "Uploading..." : "Upload & Re-extract"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
