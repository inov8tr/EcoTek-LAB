export const runtime = "nodejs";

import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { dbApi } from "@/lib/dbApi";
import { DashboardCard } from "@/components/ui/dashboard-card";

type SummaryDetail = {
  id: string;
  binderTestId: string;
  version: number;
  doiLikeId: string;
  status: string;
  createdAt: string;
  createdByUserId?: string | null;
  createdByRole?: string | null;
  derivedFromMetricsHash: string;
  summaryJson: {
    binder_test_id: string;
    version: number;
    doi_like_id: string;
    created_at: string;
    created_by_user_id?: string | null;
    created_by_role?: string | null;
    metrics: any[];
    evidence_files: { id: string; filename?: string | null }[];
    notes?: string;
  };
};

type PeerComment = {
  id: string;
  commentType: string;
  commentText: string;
  createdAt: string;
  createdByUserId?: string | null;
  createdByRole?: string | null;
};

type PeerDecision = {
  id: string;
  decision: string;
  decisionNotes?: string | null;
  createdAt: string;
  reviewerUserId?: string | null;
  reviewerRole?: string | null;
};

type PageProps = { params: Promise<{ id: string; version: string }> };

export default async function BinderTestSummaryPage({ params }: PageProps) {
  const { id, version } = await params;
  const summary = await loadSummary(id, version);
  if (!summary) {
    notFound();
  }
  const comments = await loadPeerComments(id, Number(version));
  const decisions = await loadPeerDecisions(id, Number(version));
  const metrics = summary.summaryJson?.metrics ?? [];
  const evidence = summary.summaryJson?.evidence_files ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Summary v{summary.version}</h1>
          <p className="text-[var(--color-text-muted)]">{summary.doiLikeId}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Created {new Date(summary.createdAt).toLocaleString()} by {summary.createdByUserId ?? "system"}{" "}
            {summary.createdByRole ? `(${summary.createdByRole})` : ""}
          </p>
        </div>
        <Link href={`/binder-tests/${id}` as Route} className="text-[var(--color-text-link)] underline">
          Back to binder test
        </Link>
      </div>

      <DashboardCard title="Confirmed Metrics">
        {metrics.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No metrics recorded in this summary.</p>
        ) : (
          <div className="space-y-2">
            {metrics.map((m: any) => (
              <div key={m.id} className="rounded-lg border border-border-subtle bg-white/70 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {m.metricName ?? m.metricType} {m.position ? `· ${m.position}` : ""}
                  </p>
                  <span className="text-xs text-[var(--color-text-muted)]">{m.language ?? ""}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatScalar(m.value, "—")} {formatScalar(m.units, "")} {m.temperature ? `@ ${formatScalar(m.temperature)}` : ""}{" "}
                  {m.frequency ? `· ${formatScalar(m.frequency)}` : ""}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Source: {formatSource((m as any).sourceFile ?? (m as any).sourceFileId)} {m.sourcePage ? `p.${m.sourcePage}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard title="Evidence files">
        {evidence.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No evidence captured for this summary.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-main)]">
            {evidence.map((f) => (
              <li key={f.id}>{f.filename ?? f.id}</li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard title="Peer review">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">Comments</p>
            {comments.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No comments for this version.</p>
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
              <p className="text-sm text-[var(--color-text-muted)]">No decisions recorded.</p>
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
        </div>
      </DashboardCard>
    </div>
  );
}

async function loadSummary(id: string, version: string): Promise<SummaryDetail | null> {
  try {
    return await dbApi<SummaryDetail>(`/binder-tests/${id}/summaries/${version}`);
  } catch (err) {
    console.error("loadSummary", err);
    return null;
  }
}

async function loadPeerComments(id: string, version: number): Promise<PeerComment[]> {
  try {
    return await dbApi<PeerComment[]>(`/binder-tests/${id}/peer-comments?version=${version}`);
  } catch (err) {
    const status = (err as any)?.status;
    const message = (err as any)?.message ?? "";
    if (status === 404 || message.includes("Not Found")) return [];
    console.error("loadPeerComments summary page", err);
    return [];
  }
}

async function loadPeerDecisions(id: string, version: number): Promise<PeerDecision[]> {
  try {
    return await dbApi<PeerDecision[]>(`/binder-tests/${id}/peer-review-decisions?version=${version}`);
  } catch (err) {
    const status = (err as any)?.status;
    const message = (err as any)?.message ?? "";
    if (status === 404 || message.includes("Not Found")) return [];
    console.error("loadPeerDecisions summary page", err);
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
