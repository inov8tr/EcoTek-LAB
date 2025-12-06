import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChartCard } from "@/components/ui/chart-card";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/files/file-upload-button";
import { DocumentList } from "@/components/files/document-list";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { getBatchDetailData } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth-helpers";
import { viewerDownloadsEnabled } from "@/lib/feature-flags";
import { notFound } from "next/navigation";
import { archiveBatch, restoreBatch } from "@/app/actions/archive";
import { formatDate } from "@/lib/utils";

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const [batch, currentUser] = await Promise.all([
    getBatchDetailData(params.id),
    getCurrentUser(),
  ]);
  if (!batch) {
    notFound();
  }
  const canUpload = currentUser?.role === "ADMIN" || currentUser?.role === "RESEARCHER";
  const canDeleteFiles = currentUser?.role === "ADMIN";
  const allowRequests = currentUser?.role === "RESEARCHER";
  const canDownload =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "RESEARCHER" ||
    viewerDownloadsEnabled;
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/batches"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-link)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Batches
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Batch {batch.batch}</h1>
            <p className="text-[var(--color-text-muted)]">
              {batch.date} · Formulation {batch.formulation} · Operator {batch.operator ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={batch.status} />
            {batch.archived && (
              <span className="rounded-full bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                Archived {batch.archivedAt ? formatDate(new Date(batch.archivedAt)) : ""}
              </span>
            )}
            {isAdmin && (
              <ViewModeGate minRole="ADMIN">
                <form action={batch.archived ? restoreBatch : archiveBatch}>
                  <input type="hidden" name="slug" value={batch.id} />
                  <Button
                    variant="ghost"
                    type="submit"
                    className="text-sm text-[var(--color-text-link)] hover:underline"
                  >
                    {batch.archived ? "Restore batch" : "Archive batch"}
                  </Button>
                </form>
              </ViewModeGate>
            )}
            {canUpload && (
              <ViewModeGate
                minRole="RESEARCHER"
                fallback={
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    This action is unavailable in Viewer Mode.
                  </p>
                }
              >
                <Button asChild className="rounded-full">
                  <Link
                    href={{
                      pathname: "/tests/new",
                      query: { batch: batch.numericId },
                    }}
                  >
                    Add binder test
                  </Link>
                </Button>
              </ViewModeGate>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ChartCard title="Mixing Conditions" description="Actual run parameters">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">RPM</p>
              <p className="text-2xl font-semibold text-[var(--color-text-heading)]">
                {batch.rpm ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Duration</p>
              <p className="text-2xl font-semibold text-[var(--color-text-heading)]">
                {batch.durationMinutes ? `${batch.durationMinutes} min` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Start Temp</p>
              <p className="text-2xl font-semibold text-[var(--color-text-heading)]">
                {batch.startTemp ?? "—"}°C
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Final Temp</p>
              <p className="text-2xl font-semibold text-[var(--color-text-heading)]">
                {batch.finalTemp ?? "—"}°C
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-main)]">{batch.notes}</p>
        </ChartCard>

        <ChartCard title="Mixing Curve" description="Temperature vs. time">
          <LineTrendChart
            data={batch.mixingCurve}
            xKey="minute"
            lines={[
              {
                dataKey: "temperature",
                color: "var(--color-accent-primary)",
                name: "Temp °C",
              },
            ]}
            hideDots
          />
        </ChartCard>
      </section>

      <ChartCard
        title="Documents & uploads"
        description="Attach supporting PDFs, lab notes, or raw instrument exports."
      >
        <div className="space-y-4">
          {canUpload && (
            <ViewModeGate minRole="RESEARCHER">
              <FileUploadButton target="batch" targetId={batch.numericId} />
            </ViewModeGate>
          )}
          <DocumentList
            attachments={batch.attachments}
            canDelete={!!canDeleteFiles}
            canDownload={canDownload}
            allowRequests={!!allowRequests}
            requestTargetTable="FileAttachment"
          />
        </div>
      </ChartCard>
    </div>
  );
}
