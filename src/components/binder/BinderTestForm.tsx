"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next"; // <----- ADD THIS
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type PmaOption = { id: string; label: string };

type BinderTestFormProps = {
  pmaOptions?: PmaOption[];
};

export function BinderTestForm({ pmaOptions = [] }: BinderTestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [extracted, setExtracted] = useState<Record<string, number | null>>({
    pgHigh: null,
    pgLow: null,
    softeningTop: null,
    softeningBottom: null,
    deltaSoftening: null,
    viscosity135: null,
    softeningPoint: null,
    ductility15: null,
    ductility25: null,
    recovery: null,
    jnr: null,
    solubility: null,
  });

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setAllFiles((prev) => [...prev, ...Array.from(files)]);
  }

  async function extractPdfData(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/binder-tests/extract", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      console.error("Extraction failed");
      return;
    }
    const json = await res.json();
    if (json?.data) {
      setExtracted((prev) => ({ ...prev, ...json.data }));
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      Object.entries(extracted).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      allFiles.forEach((file) => {
        const type = file.type.toLowerCase();
        if (type.includes("pdf")) {
          formData.append("pdfReport", file);
        } else if (type.startsWith("image/")) {
          formData.append("photos", file);
        } else if (type.startsWith("video/")) {
          formData.append("videos", file);
        }
      });

      const res = await fetch("/api/binder-tests", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();

      router.push(`/binder-tests/${json.id}/review` as Route);

    } catch (err) {
      console.error(err);
      alert("Failed to create binder test");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6 rounded-xl border bg-card p-6" action={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Test Name</Label>
          <Input id="name" name="name" placeholder="PG 76-28 – DSR run with 1% reagent" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchId">Batch ID</Label>
          <Input id="batchId" name="batchId" placeholder="Batch-2025-01-A" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pmaFormulaId">PMA Formula (optional)</Label>
          <select
            id="pmaFormulaId"
            name="pmaFormulaId"
            className="w-full rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm"
            defaultValue=""
          >
            <option value="">No PMA link</option>
            {pmaOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator">Operator</Label>
          <Input id="operator" name="operator" placeholder="Dr. Lee" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lab">Lab</Label>
          <Input id="lab" name="lab" placeholder="KCL, KICT, private lab..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Any comments about mixing, storage stability behavior, anomalies, etc."
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Upload Files</Label>
        <Button type="button" variant="secondary" onClick={() => setShowUploader(true)}>
          Open uploader
        </Button>
        <p className="text-xs text-muted-foreground">
          Add report PDF, photos, and videos; we’ll categorize them automatically.
        </p>
        <div className="mt-2 space-y-2 rounded-lg border border-border-subtle bg-white/80 p-3">
          <Label className="text-xs font-semibold text-[var(--color-text-heading)]">Extract binder values from PDF</Label>
          <input
            type="file"
            accept="application/pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await extractPdfData(file);
            }}
            className="text-sm"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            We’ll auto-fill PG, softening, viscosity, ductility, recovery, Jnr, and solubility when detected.
          </p>
          <div className="text-xs text-[var(--color-text-muted)]">
            {Object.entries(extracted).some(([, v]) => v !== null) ? (
              <ul className="list-disc pl-4">
                {Object.entries(extracted).map(([k, v]) => (
                  <li key={k} className="capitalize text-[var(--color-text-heading)]">
                    {k}: {v ?? "—"}
                  </li>
                ))}
              </ul>
            ) : (
              <span>No extracted values yet.</span>
            )}
          </div>
        </div>
      </div>
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Upload files</h3>
              <Button variant="ghost" onClick={() => setShowUploader(false)}>
                Close
              </Button>
            </div>
            <div
              className={`mt-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
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
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
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
              {allFiles.length > 0 && (
                <div className="mt-4 text-left text-xs text-[var(--color-text-muted)] max-h-32 overflow-y-auto">
                  <p className="font-semibold text-[var(--color-text-heading)] text-sm mb-1">Selected files:</p>
                  <ul className="space-y-1">
                    {allFiles.map((f, idx) => (
                      <li key={`${f.name}-${idx}`} className="truncate">
                        {f.name} ({Math.round(f.size / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setAllFiles([]); }}>
                Clear
              </Button>
              <Button
                onClick={() => setShowUploader(false)}
                className="bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Create Binder Test"}
        </Button>
      </div>
      {Object.entries(extracted).map(([key, value]) =>
        value === null || value === undefined ? null : (
          <input key={key} type="hidden" name={key} value={value} readOnly />
        )
      )}
    </form>
  );
}
