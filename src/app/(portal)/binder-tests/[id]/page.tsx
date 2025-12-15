export const runtime = "nodejs";

import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { dbApi } from "@/lib/dbApi";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { ConfirmButtonClient, ParseButtonClient } from "@/components/binder/parse-confirm-buttons";
import { ParsedDataViewer } from "@/components/binder/ParsedDataViewer";
import { GenerateSummaryButton } from "@/components/binder/GenerateSummaryButton";
import { PeerReviewForms } from "@/components/binder/PeerReviewForms";
import { EvidenceGroupedView } from "@/components/binder/EvidenceGroupedView";
import { FileUploadButton } from "@/components/files/file-upload-button";
import { ProgressSteps } from "@/components/binder/ProgressSteps";
import { ManualMetricForm } from "@/components/binder/ManualMetricForm";
import { InvalidateMetricButton } from "@/components/binder/InvalidateMetricButton";

type BinderTestDetail = {
  id: string;
  status: string;
  lifecycleStatus?: string | null;
  pmaTestBatch?: { id: string; batchCode: string | null } | null;
  pmaTestBatchCode?: string | null;
  pmaTestBatchId?: string | null;
  bitumenOrigin?: { refineryName: string | null } | null;
  capsuleFormula?: { name: string | null } | null;
  conditioning?: string | null;
  notes?: string | null;
  updatedAt: string;
  files?: {
    id: string;
    fileName: string;
    mimeType: string | null;
    size?: number | null;
    url: string;
    createdAt: string;
    uploadSection?: string | null;
    uploadedBy?: string | null;
    uploadedAt?: string | null;
    uploadedAfterFinalization?: boolean;
  }[];
};

type Metric = {
  id: string;
  metricType: string;
  metricName?: string | null;
  position: string | null;
  value: string | number | null;
  units: string | null;
  temperature: string | number | null;
  frequency: string | number | null;
  sourceFile: { id?: string; filename?: string | null } | null;
  sourcePage?: number | null;
  confidence?: string | number | null;
  language: string | null;
  isUserConfirmed: boolean;
  parseRunId?: string | null;
  isInvalidated?: boolean;
  invalidationReason?: string | null;
};

type SummaryListItem = {
  version: number;
  doiLikeId: string;
  status: string;
  createdAt: string;
  createdByUserId?: string | null;
  createdByRole?: string | null;
  supersedesSummaryId?: string | null;
};

type PeerComment = {
  id: string;
  summaryVersion: number | null;
  commentType: string;
  commentText: string;
  createdByUserId?: string | null;
  createdByRole?: string | null;
  createdAt: string;
  resolved: boolean;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
};

type PeerDecision = {
  id: string;
  summaryVersion: number;
  decision: string;
  decisionNotes?: string | null;
  reviewerUserId?: string | null;
  reviewerRole?: string | null;
  createdAt: string;
};

type PageProps = { params: Promise<{ id: string }> };

export default async function BinderTestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await loadBinderTest(id);
  if (!detail) {
    notFound();
  }

  const files: BinderTestDetail["files"] = detail.files ?? [];
  const metrics: Metric[] = detail.metrics ?? (await loadMetrics(id));
  const summaries = await loadSummaries(id);
  const latestSummary = summaries[0];
  const summaryVersion = latestSummary?.version ?? null;
  const comments = summaryVersion ? await loadPeerComments(id, summaryVersion) : [];
  const decisions = summaryVersion ? await loadPeerDecisions(id, summaryVersion) : [];
  const hasFiles = files.length > 0;
  const lifecycleStatus = detail.lifecycleStatus ?? detail.status;
  const latestSummaryCreatedAt = latestSummary ? new Date(latestSummary.createdAt).getTime() : null;
  const newestFileUploadedAt =
    files.length > 0 ? Math.max(...files.map((f) => new Date(f.createdAt).getTime())) : null;
  const newEvidence =
    latestSummaryCreatedAt !== null && newestFileUploadedAt !== null && newestFileUploadedAt > latestSummaryCreatedAt;
  const stepStates = buildStepStates(lifecycleStatus, Boolean(latestSummary));
  const invalidatedCount = metrics.filter((m) => m.isInvalidated).length;

  return (
    <div className="space-y-6">
      <ProgressSteps steps={stepStates} />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Binder Test {detail.id}</h1>
          <p className="text-[var(--color-text-muted)]">
            Status: {lifecycleStatus} · PMA Batch: {detail.pmaTestBatch?.batchCode ?? detail.pmaTestBatchCode ?? "N/A"} ·
            Origin: {detail.bitumenOrigin?.refineryName ?? "N/A"} · Capsule: {detail.capsuleFormula?.name ?? "N/A"}
          </p>
          <p className="text-[var(--color-text-muted)] text-sm">
            Conditioning: {detail.conditioning || "N/A"} · Updated: {new Date(detail.updatedAt).toLocaleString()}
          </p>
          {newEvidence && latestSummary && (
            <div className="mt-2">
              <Badge variant="secondary">New evidence added since Summary v{latestSummary.version}</Badge>
            </div>
          )}
        </div>
        <ViewModeGate minRole="RESEARCHER">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" asChild className="bg-primary text-white hover:bg-primaryHover">
              <Link href={"/binder-tests" as Route}>Back to list</Link>
            </Button>
            <ParsedDataViewer metrics={metrics} />
            {latestSummary ? (
              <Button asChild variant="secondary">
                <Link href={`/binder-tests/${id}/summary/${latestSummary.version}` as Route}>View Final Summary</Link>
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                View Final Summary
              </Button>
            )}
            <GenerateSummaryButton binderTestId={detail.id} disabled={lifecycleStatus !== "READY" || Boolean(latestSummary)} />
          </div>
        </ViewModeGate>
      </header>

      <DashboardCard
        title="Upload Evidence"
        description="Batch upload any binder test evidence. VM will classify and decide parse eligibility."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-border-subtle bg-white/70 p-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-heading)]">Batch upload</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Drag-and-drop or multi-select. File type filters are client-only; VM decides how to use each file.
            </p>
            <ViewModeGate minRole="RESEARCHER">
              <FileUploadButton target="binder_test" targetId={detail.id} uploadSection={undefined} />
            </ViewModeGate>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Evidence"
        description="Grouped by VM-provided upload_section. Filters are visual only and do not affect parsing."
      >
        {files.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No files yet.</p>
        ) : (
          <EvidenceGroupedView files={files} latestSummaryCreatedAt={latestSummaryCreatedAt} />
        )}
      </DashboardCard>

      <DashboardCard title="Parse & Interpret">
        <p className="text-sm text-[var(--color-text-muted)] mb-3">Send files to Python for parsing.</p>
        <ParseButton binderTestId={detail.id} hasFiles={hasFiles} />
      </DashboardCard>

      <DashboardCard title="Review Extracted Binder Metrics">
        {invalidatedCount > 0 && (
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">
            {invalidatedCount} parsed metric{invalidatedCount === 1 ? " was" : "s were"} invalidated and excluded from analysis.
          </p>
        )}
        {metrics.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No metrics yet.</p>
        ) : (
          <div className="space-y-3">
            {metrics.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border border-border-subtle bg-white/70 px-3 py-2 text-sm text-[var(--color-text-main)] ${
                  m.isInvalidated ? "opacity-70 grayscale" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {m.metricName ?? m.metricType} {m.position ? `· ${m.position}` : ""}
                  </p>
                  <span className="text-xs text-[var(--color-text-muted)]">{m.language ?? "?"}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatScalar(m.value, "—")} {formatScalar(m.units, "")} {m.temperature ? `@ ${formatScalar(m.temperature, "—")}` : ""}{" "}
                  {m.frequency ? `· ${formatScalar(m.frequency)}` : ""}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Source: {formatSource(m.sourceFile)} {m.sourcePage ? `p.${m.sourcePage}` : ""} · Confidence:{" "}
                  {formatScalar(m.confidence, "?")} · {m.isUserConfirmed ? "Confirmed" : "Pending"}
                </p>
                {m.parseRunId && (
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Parse run: {m.parseRunId}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {m.isInvalidated && (
                    <>
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        Invalidated
                      </span>
                      {m.invalidationReason && (
                        <details className="text-xs text-[var(--color-text-muted)]">
                          <summary className="cursor-pointer underline">Reason</summary>
                          <div className="mt-1 rounded border border-border-subtle bg-white/70 p-2 text-[var(--color-text-main)]">
                            {m.invalidationReason}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                  {!m.isInvalidated && !m.isUserConfirmed && !latestSummary && (
                    <InvalidateMetricButton binderTestId={detail.id} metricId={m.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <ViewModeGate minRole="RESEARCHER">
            <ManualMetricForm binderTestId={detail.id} files={files} />
          </ViewModeGate>
        </div>
      </DashboardCard>

      <DashboardCard title="Finalized Summaries" description="Immutable versions derived from confirmed metrics.">
        {summaries.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No summaries have been generated yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border-subtle bg-white/70">
            {summaries.map((s) => (
              <div key={s.version} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-[var(--color-text-heading)]">
                    v{s.version} · {s.doiLikeId}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {s.status} · Created {new Date(s.createdAt).toLocaleString()} by {s.createdByUserId ?? "system"}
                  </p>
                </div>
                <Link href={`/binder-tests/${id}/summary/${s.version}` as Route} className="text-[var(--color-text-link)] underline">
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard title="Peer Review" description={summaryVersion ? `Reviewing summary v${summaryVersion}` : "Generate a summary first."}>
        {summaryVersion ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Comments</p>
              {comments.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No peer comments yet.</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border-subtle bg-white/70 px-3 py-2 text-sm">
                      <p className="font-semibold text-[var(--color-text-heading)]">
                        {c.commentType} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {c.commentText} — {c.createdByRole ?? "Reviewer"} {c.createdByUserId ?? ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">Decisions</p>
              {decisions.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No peer review decisions yet.</p>
              ) : (
                <div className="space-y-2">
                  {decisions.map((d) => (
                    <div key={d.id} className="rounded-lg border border-border-subtle bg-white/70 px-3 py-2 text-sm">
                      <p className="font-semibold text-[var(--color-text-heading)]">
                        {d.decision} · {new Date(d.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {d.decisionNotes ?? "No notes"} — {d.reviewerRole ?? "Reviewer"} {d.reviewerUserId ?? ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ViewModeGate minRole="RESEARCHER">
              <PeerReviewForms binderTestId={detail.id} summaryVersion={summaryVersion} />
            </ViewModeGate>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Create a summary to begin peer review.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Confirm Binder Test">
        <ConfirmButton binderTestId={detail.id} />
      </DashboardCard>
    </div>
  );
}

function ParseButton({ binderTestId, hasFiles }: { binderTestId: string; hasFiles: boolean }) {
  return <ParseButtonClient binderTestId={binderTestId} disabled={!hasFiles} />;
}

function ConfirmButton({ binderTestId }: { binderTestId: string }) {
  return <ConfirmButtonClient binderTestId={binderTestId} />;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${units[idx]}`;
}

async function loadBinderTest(id: string): Promise<BinderTestDetail | null> {
  try {
    const detail = await dbApi<BinderTestDetail & { files?: any[]; metrics?: Metric[] }>(`/db/binder-tests/${id}`);
    const mappedFiles =
      detail.files?.map((f) => {
        const rawUrl = f.url ?? f.fileUrl ?? f.path ?? "";
        const isHttp = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
        const needsProxy = rawUrl && !isHttp && !rawUrl.startsWith("/api/binder-tests/file");
        const proxyUrl = needsProxy ? `/api/binder-tests/file?path=${encodeURIComponent(path.normalize(rawUrl))}` : rawUrl;
        return {
          id: f.id ?? f.fileId ?? f.fileUrl,
          fileName: f.fileName ?? f.label ?? f.fileUrl ?? rawUrl,
          mimeType: f.mimeType ?? f.fileType ?? null,
          size: f.size ?? null,
          url: proxyUrl || rawUrl,
          createdAt: f.createdAt ?? f.uploadedAt ?? detail.updatedAt,
          uploadSection: f.uploadSection ?? f.upload_section ?? null,
          uploadedBy: f.uploadedBy ?? f.uploaded_by ?? null,
          uploadedAt: f.uploadedAt ?? f.uploaded_at ?? f.createdAt ?? detail.updatedAt,
          uploadedAfterFinalization: f.uploadedAfterFinalization ?? f.uploaded_after_finalization ?? false,
        };
      }) ?? [];
    return { ...detail, files: mappedFiles };
  } catch (err) {
    console.error("loadBinderTest", err);
    return null;
  }
}

async function loadMetrics(id: string): Promise<Metric[]> {
  try {
    return await dbApi<Metric[]>(`/binder-tests/${id}/metrics`);
  } catch (err) {
    console.error("loadMetrics", err);
    return [];
  }
}

async function loadSummaries(id: string): Promise<SummaryListItem[]> {
  try {
    const summaries = await dbApi<SummaryListItem[]>(`/binder-tests/${id}/summaries`);
    return summaries;
  } catch (err) {
    console.error("loadSummaries", err);
    return [];
  }
}

async function loadPeerComments(id: string, version: number): Promise<PeerComment[]> {
  try {
    const comments = await dbApi<PeerComment[]>(`/binder-tests/${id}/peer-comments?version=${version}`);
    return comments;
  } catch (err: any) {
    if (err?.status === 404 || (err?.message || "").includes("Not Found")) return [];
    console.error("loadPeerComments", err);
    return [];
  }
}

async function loadPeerDecisions(id: string, version: number): Promise<PeerDecision[]> {
  try {
    const decisions = await dbApi<PeerDecision[]>(`/binder-tests/${id}/peer-review-decisions?version=${version}`);
    return decisions;
  } catch (err: any) {
    if (err?.status === 404 || (err?.message || "").includes("Not Found")) return [];
    console.error("loadPeerDecisions", err);
    return [];
  }
}

function formatScalar(value: unknown, fallback: string = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") {
    const maybeFile = value as any;
    if (maybeFile?.filename || maybeFile?.fileName) return maybeFile.filename ?? maybeFile.fileName;
    if (maybeFile?.id) return maybeFile.id;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

function formatSource(source: unknown): string {
  if (source === null || source === undefined) return "?";
  if (typeof source === "object") {
    const s = source as any;
    return s.filename ?? s.fileName ?? s.url ?? s.id ?? "?";
  }
  return String(source);
}

type Step = { label: string; status: "done" | "active" | "pending" };

function buildStepStates(lifecycleStatus: string | null, hasSummary: boolean): Step[] {
  const normalized = (lifecycleStatus || "").toUpperCase();
  const steps: Step[] = [
    { label: "Upload evidence", status: "pending" },
    { label: "Parse", status: "pending" },
    { label: "Confirm metrics", status: "pending" },
    { label: "Finalize summary", status: "pending" },
  ];

  const markDone = (index: number) => {
    for (let i = 0; i <= index; i++) {
      steps[i].status = "done";
    }
  };

  const setActive = (index: number) => {
    if (steps[index].status !== "done") steps[index].status = "active";
  };

  if (hasSummary) {
    markDone(3);
    return steps;
  }

  if (["READY"].includes(normalized)) {
    markDone(2);
    setActive(3);
  } else if (["REVIEW_REQUIRED", "UNDER_REVIEW", "CLASSIFIED"].includes(normalized)) {
    markDone(1);
    setActive(2);
  } else if (["FILES_UPLOADED"].includes(normalized)) {
    markDone(0);
    setActive(1);
  } else {
    setActive(0);
  }

  return steps;
}
