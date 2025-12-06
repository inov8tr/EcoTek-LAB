import fs from "fs";
import path from "path";
import mime from "mime-types";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BINDER_BASE_PATH } from "@/lib/binder/storage";

type PageProps = { params: Promise<{ id: string }> };

type FileEntry = {
  name: string;
  path: string;
  mimeType: string;
};

export default async function BinderTestDocumentsPage({ params }: PageProps) {
  const { id } = await params;
  const binderTest = await prisma.binderTest.findUnique({ where: { id } });
  if (!binderTest) return notFound();

  const folderName = binderTest.folderName;
  if (!folderName) return notFound();

  const folderPath = path.join(BINDER_BASE_PATH, folderName);
  const originalDir = path.join(folderPath, "original");
  const aiDir = path.join(folderPath, "ai");
  const metadataDir = path.join(folderPath, "metadata");

  const originals = listFiles(originalDir);
  const aiFiles = listFiles(aiDir);
  const metadataFiles = listFiles(metadataDir);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Binder Test – Documents</p>
          <h1 className="text-2xl font-semibold tracking-tight">{binderTest.name}</h1>
          <p className="text-sm text-muted-foreground">Folder: {folderName}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/binder-tests/${id}` as Route} className="text-[var(--color-text-link)] underline">
            View data
          </Link>
          <Link href={`/binder-tests/${id}/review` as Route} className="text-[var(--color-text-link)] underline">
            Review data
          </Link>
        </div>
      </div>

      <DocumentSection title="Original Files" files={originals} />
      <DocumentSection title="AI Outputs" files={aiFiles} />
      <DocumentSection title="Metadata" files={metadataFiles} />
    </div>
  );
}

function listFiles(dir: string): FileEntry[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((name) => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (!stat.isFile()) return null;
      const mimeType = (mime.lookup(full) || "application/octet-stream").toString();
      return { name, path: full, mimeType };
    })
    .filter(Boolean) as FileEntry[];
}

function DocumentSection({ title, files }: { title: string; files: FileEntry[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{files.length} file{files.length === 1 ? "" : "s"}</span>
      </div>
      {files.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No files available.</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const url = `/api/binder-tests/file?path=${encodeURIComponent(file.path)}`;
            const isImage = file.mimeType.startsWith("image/");
            const isPdf = file.mimeType === "application/pdf";
            return (
              <li key={file.path} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{file.name}</span>
                  <span>{file.mimeType}</span>
                </div>
                {isImage && (
                  <div className="mt-2 overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={file.name} className="h-32 w-full object-cover" />
                  </div>
                )}
                {isPdf && (
                  <div className="mt-2 text-xs text-muted-foreground">PDF file</div>
                )}
                <div className="mt-3">
                  <Link href={url as Route} className="text-sm text-[var(--color-text-link)] underline">
                    Download
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
