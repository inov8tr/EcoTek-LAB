import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { BinderTestReviewForm } from "./BinderTestReviewForm";
import { BINDER_BASE_PATH } from "@/lib/binder/storage";
import type { BinderTestExtractedData } from "@/lib/binder/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function BinderTestReviewPage({ params }: PageProps) {
  await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  const { id } = await params;

  const binderTest = await prisma.binderTest.findUnique({ where: { id } });
  if (!binderTest) return notFound();

  const folderName = binderTest.folderName;
  if (!folderName) return notFound();
  const folderPath = path.join(BINDER_BASE_PATH, folderName);
  const metadataDir = path.join(folderPath, "metadata");
  const aiDir = path.join(folderPath, "ai");

  const parsedPath = path.join(metadataDir, "parsed_deterministic.json");
  const parsedData: BinderTestExtractedData | null =
    fs.existsSync(parsedPath) ? JSON.parse(fs.readFileSync(parsedPath, "utf8")) : null;
  const aiPath = path.join(aiDir, "ai_extraction.json");
  const aiData: BinderTestExtractedData | null =
    fs.existsSync(aiPath) ? JSON.parse(fs.readFileSync(aiPath, "utf8")) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Binder Test – Review</p>
          <h1 className="text-2xl font-semibold tracking-tight">{binderTest.name}</h1>
          <p className="text-sm text-muted-foreground">Status: {binderTest.status}</p>
        </div>
        <Link href={`/binder-tests/${id}/documents` as Route} className="text-sm text-[var(--color-text-link)] underline">
          View documents →
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3 font-semibold">
          Extracted Data (Review & Fix)
          <span className="ml-2 text-xs text-muted-foreground">
            AI confidence: {binderTest.aiConfidence ?? "—"}
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-xs text-muted-foreground">
            Parsed (deterministic): {parsedData ? "Loaded" : "Not available"} · AI: {aiData ? "Loaded" : "Not used"}
          </div>
          <BinderTestReviewForm binderTest={{ ...binderTest, aiExtractedData: binderTest.aiExtractedData ?? (aiData ? { data: aiData } : null) } as any} />
          <div className="mt-4 text-right">
            <Link href={`/binder-tests/${id}` as Route} className="text-sm text-[var(--color-text-link)] underline">
              ← Back to view page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
