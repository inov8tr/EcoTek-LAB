"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";

interface DeletionRequestRow {
  id: number;
  targetTable: string;
  targetId: string;
  reason: string;
  status: DeleteStatus;
  createdAt: string;
  resolvedAt: string | null;
  requester: {
    name: string | null;
    email: string | null;
  };
}

interface AdminReviewTableProps {
  requests: DeletionRequestRow[];
}

export function AdminReviewTable({ requests }: AdminReviewTableProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function act(action: "approve" | "reject", id: number) {
    startTransition(async () => {
      await fetch(`/api/deletion-requests/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No deletion requests at this time.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full table-auto text-left text-sm">
        <thead className="text-[var(--color-text-muted)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Record</th>
            <th className="px-4 py-3 font-semibold">Reason</th>
            <th className="px-4 py-3 font-semibold">Requested by</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Submitted</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-t border-border/70 text-[var(--color-text-main)]">
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--color-text-heading)]">{request.targetTable}</p>
                <p className="text-xs text-[var(--color-text-muted)]">ID {request.targetId}</p>
              </td>
              <td className="px-4 py-3">{request.reason}</td>
              <td className="px-4 py-3">
                {request.requester.name ?? request.requester.email ?? "Unknown"}
              </td>
              <td className="px-4 py-3 capitalize">{request.status.toLowerCase()}</td>
              <td className="px-4 py-3">{formatDate(new Date(request.createdAt))}</td>
              <td className="px-4 py-3">
                {request.status === DeleteStatus.PENDING ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => act("approve", request.id)}
                      className="rounded-full bg-[var(--color-status-pass-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-status-pass-text)] disabled:opacity-60"
                      disabled={isPending}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => act("reject", request.id)}
                      className="rounded-full bg-[var(--color-status-fail-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-status-fail-text)] disabled:opacity-60"
                      disabled={isPending}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {request.resolvedAt ? `Resolved ${formatDate(new Date(request.resolvedAt))}` : "Resolved"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
