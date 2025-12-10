"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

export function AdditionalDocsUploader({ binderTestId }: { binderTestId: string }) {
  const [show, setShow] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [parsePdf, setParsePdf] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  async function handleUpload() {
    if (files.length === 0) {
      alert("Add at least one file to upload.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        const type = file.type.toLowerCase();
        if (type.includes("pdf")) {
          formData.append("pdfReport", file);
        } else if (type.startsWith("image/")) {
          formData.append("photos", file);
        } else if (type.startsWith("video/")) {
          formData.append("videos", file);
        } else {
          formData.append("attachments", file);
        }
      });
      formData.set("parsePdf", parsePdf ? "on" : "off");
      const res = await fetch(`/api/binder-tests/${binderTestId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upload documents.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Add documents</h2>
          <p className="text-xs text-muted-foreground">Upload additional PDFs/photos/videos. Optionally re-parse PDFs.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setShow((v) => !v)}>
          {show ? "Hide" : "Upload"}
        </Button>
      </div>
      {show && (
        <div
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
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
          <p className="text-sm text-[var(--color-text-heading)]">Drag & drop PDFs, images, or videos</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">PDF reports enable parsing and verification.</p>
          <div className="mt-3 flex justify-center gap-3">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Browse files
            </Button>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-heading)]">
              <input
                type="checkbox"
                checked={parsePdf}
                onChange={(e) => setParsePdf(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Parse PDFs after upload</span>
            </label>
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
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFiles([])} disabled={isSubmitting}>
              Clear
            </Button>
            <Button onClick={handleUpload} disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
