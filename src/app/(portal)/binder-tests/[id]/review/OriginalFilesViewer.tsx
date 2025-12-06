"use client";

import { useEffect, useState } from "react";

type ViewerMedia =
  | { type: "image"; url: string }
  | { type: "pdf"; url: string }
  | { type: "video"; url: string };

interface Props {
  pdfUrl: string | null;
  photoUrls: string[];
  videoUrls: string[];
}

export function OriginalFilesViewer({ pdfUrl, photoUrls, videoUrls }: Props) {
  const [viewer, setViewer] = useState<ViewerMedia | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

  function open(media: ViewerMedia) {
    setViewer(media);
    setZoom(1);
  }

  function changeZoom(delta: number) {
    setZoom((z) => {
      const next = Math.min(4, Math.max(0.25, Number((z + delta).toFixed(2))));
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {pdfUrl ? (
        <button
          type="button"
          onClick={() => open({ type: "pdf", url: pdfUrl })}
          className="block w-full overflow-hidden rounded border hover:ring-2 hover:ring-primary/50"
        >
          <div className="h-96 w-full bg-muted">
            <iframe src={pdfUrl} className="h-full w-full" title="Lab Report PDF" />
          </div>
        </button>
      ) : (
        <p className="text-sm text-muted-foreground">No PDF uploaded.</p>
      )}

      {photoUrls.length ? (
        <div className="grid grid-cols-2 gap-2">
          {photoUrls.map((url, idx) => (
            <button
              key={url ?? idx}
              type="button"
              onClick={() => open({ type: "image", url: url! })}
              className="overflow-hidden rounded border bg-white hover:ring-2 hover:ring-primary/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url!} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No photos uploaded.</p>
      )}

      {videoUrls.length ? (
        <div className="space-y-2">
          {videoUrls.map((url, idx) => (
            <button
              key={url ?? idx}
              type="button"
              onClick={() => open({ type: "video", url: url! })}
              className="block w-full overflow-hidden rounded border bg-black hover:ring-2 hover:ring-primary/50"
            >
              <video className="w-full" muted>
                <source src={url!} />
              </video>
            </button>
          ))}
        </div>
      ) : null}

      {viewer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewer(null);
          }}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] w-full bg-background rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2 bg-background/80 backdrop-blur">
              <div className="text-sm font-medium">Viewer</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeZoom(-0.25)}
                  className="rounded border px-2 py-1 text-xs font-semibold hover:bg-muted"
                >
                  -
                </button>
                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => changeZoom(0.25)}
                  className="rounded border px-2 py-1 text-xs font-semibold hover:bg-muted"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded border px-2 py-1 text-xs font-semibold hover:bg-muted"
                >
                  Reset
                </button>
                <a
                  href={viewer.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border px-2 py-1 text-xs font-semibold hover:bg-muted"
                >
                  Open tab
                </a>
                <button
                  type="button"
                  onClick={() => setViewer(null)}
                  className="rounded border px-2 py-1 text-xs font-semibold hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center bg-black/90">
              {viewer.type === "image" && (
                <div className="overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewer.url}
                    alt="Preview"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                    className="max-h-[80vh] max-w-[90vw] object-contain"
                  />
                </div>
              )}
              {viewer.type === "pdf" && (
                <div className="max-h-[80vh] max-w-[90vw] overflow-auto bg-white">
                  <iframe
                    src={viewer.url}
                    title="PDF preview"
                    className="h-[80vh] w-[90vw]"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
                  />
                </div>
              )}
              {viewer.type === "video" && (
                <div className="max-h-[80vh] max-w-[90vw]">
                  <video
                    src={viewer.url}
                    controls
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                    className="max-h-[80vh] max-w-[90vw]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
