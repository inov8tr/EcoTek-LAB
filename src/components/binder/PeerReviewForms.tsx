"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  binderTestId: string;
  summaryVersion?: number | null;
  disabled?: boolean;
};

export function PeerReviewForms({ binderTestId, summaryVersion, disabled }: Props) {
  const router = useRouter();
  const [commentType, setCommentType] = useState("QUESTION");
  const [commentText, setCommentText] = useState("");
  const [decision, setDecision] = useState("APPROVE");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = !!summaryVersion && !disabled;

  function handleSubmitComment() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/binder-tests/${binderTestId}/peer-comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentType, commentText, summaryVersion }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Unable to add comment");
        return;
      }
      setCommentText("");
      router.refresh();
    });
  }

  function handleSubmitDecision() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/binder-tests/${binderTestId}/peer-review-decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, decisionNotes, summaryVersion }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Unable to add decision");
        return;
      }
      setDecisionNotes("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border-subtle bg-white/70 p-3">
        <h4 className="text-sm font-semibold text-[var(--color-text-heading)]">Add comment</h4>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={commentType}
            onChange={(e) => setCommentType(e.target.value)}
            disabled={!canSubmit || pending}
          >
            <option value="QUESTION">Question</option>
            <option value="CONCERN">Concern</option>
            <option value="NOTE">Note</option>
          </select>
          <textarea
            className="md:col-span-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Peer review note..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            disabled={!canSubmit || pending}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={!canSubmit || pending || commentText.trim().length === 0}
            className="bg-primary text-white hover:bg-primaryHover"
          >
            {pending ? "Saving..." : "Add comment"}
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-white/70 p-3">
        <h4 className="text-sm font-semibold text-[var(--color-text-heading)]">Peer review decision</h4>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            disabled={!canSubmit || pending}
          >
            <option value="APPROVE">Approve</option>
            <option value="REQUEST_CHANGES">Request changes</option>
            <option value="COMMENT_ONLY">Comment only</option>
          </select>
          <textarea
            className="md:col-span-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Decision notes (optional)"
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            rows={2}
            disabled={!canSubmit || pending}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSubmitDecision}
            disabled={!canSubmit || pending}
          >
            {pending ? "Submitting..." : "Submit decision"}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
      </div>
    </div>
  );
}
