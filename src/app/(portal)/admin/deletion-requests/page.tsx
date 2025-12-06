import { DeleteStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AdminReviewTable } from "@/components/files/admin-review-table";

export default async function AdminDeletionRequestsPage() {
  await requireRole([UserRole.ADMIN]);
  const requests = await prisma.deletionRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: {
        select: { name: true, email: true },
      },
    },
  });

  const rows = requests.map((request) => ({
    id: request.id,
    targetTable: request.targetTable,
    targetId: request.targetId,
    reason: request.reason,
    status: request.status as DeleteStatus,
    createdAt: request.createdAt.toISOString(),
    resolvedAt: request.resolvedAt ? request.resolvedAt.toISOString() : null,
    requester: {
      name: request.requester.name,
      email: request.requester.email,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Deletion requests</h1>
        <p className="text-[var(--color-text-muted)]">
          Researchers submit removal requests for review. Approve or reject each request below.
        </p>
      </div>
      <AdminReviewTable requests={rows} />
    </div>
  );
}
