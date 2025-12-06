"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, VideoIcon, UploadCloud } from "lucide-react";

type MediaRecord = {
  id: string;
  mediaUrl: string;
  mediaType: string;
  label: string | null;
};

export function BinderTestMediaPanel({ testId, media }: { testId: string; media: MediaRecord[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadMedia(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video") {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", kind);

      const res = await fetch(`/api/binder-tests/${testId}/media`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Photos & Videos</h2>
        <div className="flex items-center gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadMedia(e, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => uploadMedia(e, "video")}
          />
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Image
          </Button>
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Video
          </Button>
        </div>
      </div>

      {media.length === 0 ? (
        <p className="text-xs text-muted-foreground">No photos or videos uploaded yet.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {media.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              {m.mediaType === "image" ? <ImageIcon className="h-4 w-4 text-primary" /> : <VideoIcon className="h-4 w-4 text-primary" />}
              <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {m.label || (m.mediaType === "image" ? "Photo" : "Video")}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
