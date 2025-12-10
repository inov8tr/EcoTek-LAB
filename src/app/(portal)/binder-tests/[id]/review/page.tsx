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
import { evaluateBinderRules } from "@/lib/binder/rules";
import { StatusBadge } from "@/components/ui/status-badge";
import { findMissingOrUncertainFields } from "@/lib/binder/parser";

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
  const parsedSummary = parsedData ?? aiData ?? null;
  const missing =
    parsedSummary ? findMissingOrUncertainFields(parsedSummary as any).slice(0, 8) : [];

  const qa = evaluateBinderRules({
    recoveryPct: binderTest.recoveryPct,
    softeningPoint: binderTest.softeningPointC,
    pgHigh: binderTest.pgHigh,
    pgLow: binderTest.pgLow,
    crmPct: binderTest.crmPct,
    reagentPct: binderTest.reagentPct,
    aerosilPct: binderTest.aerosilPct,
  });

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

      <div className="rounded-xl border border-[#E3E8EF] bg-[#FFFFFF] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-[#667085]">Automated QA Checks</p>
            <p className="text-sm font-semibold text-[#1B1C1E]">Status: {qa.overall.toUpperCase()}</p>
          </div>
          <StatusBadge status={binderTest.status ?? qa.overall} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="text-sm text-[#2E2F31]">
            <span className="font-semibold">Rating:</span> {qa.rating}
          </div>
          <div className="text-sm text-[#2E2F31]">
            <span className="font-semibold">PG Grade:</span> {qa.pgGrade}
          </div>
          <div className="sm:col-span-2 text-sm text-[#2E2F31]">
            <span className="font-semibold">Flags:</span>{" "}
            {qa.flags.length ? qa.flags.join(", ") : "None"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3 font-semibold">
          Extracted Data (Review & Fix)
          <span className="ml-2 text-xs text-muted-foreground">
            AI confidence: {binderTest.aiConfidence ?? "—"}
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Parsed (deterministic): {parsedData ? "Loaded" : "Not available"} · AI: {aiData ? "Loaded" : "Not used"}</div>
            {missing.length > 0 && (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-900 border border-amber-200">
                Parser did not fill all fields. Please review: {missing.join(", ")}
              </div>
            )}
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
