"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, UploadCloud } from "lucide-react";

type FileRecord = {
  id: string;
  fileUrl: string;
  fileType: string;
  label: string | null;
};

export function BinderTestFilesPanel({ testId, files }: { testId: string; files: FileRecord[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/binder-tests/${testId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">PDF / Documents</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">No PDF reports uploaded yet.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-primary" />
                <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {f.label || "Binder test report"}
                </a>
              </div>
              <span className="text-[10px] uppercase text-muted-foreground">{f.fileType}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
