"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import TestSetInlineCreator from "@/components/analytics/test-sets/TestSetInlineCreator";
import { Button } from "@/components/ui/button";

type TestSet = {
  id: string;
  name: string;
  description?: string | null;
  tests?: { id: string }[];
  createdAt?: string | Date;
};

export default function TestSetManager({ initialSets = [] }: { initialSets: TestSet[] }) {
  const router = useRouter();
  const [sets, setSets] = useState<TestSet[]>(initialSets ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSets(initialSets ?? []);
  }, [initialSets]);

  const totalTests = useMemo(
    () => sets.reduce((sum, s) => sum + (s.tests?.length ?? 0), 0),
    [sets]
  );

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/analysis-sets/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: editingId, name: editName, description: editDesc }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Failed to update (${res.status})`);
      }
      setSets((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, name: editName, description: editDesc } : s
        )
      );
      setEditingId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-heading)]">Existing Test Sets</h2>
          <p className="text-sm text-neutral-600">
            {sets.length} sets • {totalTests} tests total
          </p>
        </div>
        <div />
      </div>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      {sets.length === 0 ? (
        <p className="text-sm text-neutral-600">No test sets yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sets.map((set) => {
            const isEditing = editingId === set.id;
            return (
              <div
                key={set.id}
                className="group cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                role="button"
                tabIndex={0}
                onClick={() => !isEditing && router.push(`/analytics/binder?setId=${set.id}`)}
                onKeyDown={(e) => {
                  if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    router.push(`/analytics/binder?setId=${set.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-full space-y-2">
                    {isEditing ? (
                      <>
                        <input
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Set name"
                        />
                        <textarea
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description (optional)"
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-[var(--color-text-heading)]">
                          {set.name}
                        </h3>
                        {set.description && (
                          <p className="text-sm text-neutral-600 line-clamp-2">{set.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>{(set.tests?.length ?? 0)} tests</span>
                    {!isEditing && (
                      <ChevronRight
                        className="h-4 w-4 text-neutral-400 group-hover:text-brand-primary"
                        aria-hidden
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    Created {set.createdAt ? new Date(set.createdAt).toLocaleDateString() : ""}
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full px-3 py-1"
                        onClick={() => {
                          setEditingId(null);
                          setError(null);
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full px-3 py-1"
                        onClick={saveEdit}
                        disabled={saving || !editName.trim()}
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-3 py-1"
                        onClick={() => {
                          setEditingId(set.id);
                          setEditName(set.name);
                          setEditDesc(set.description ?? "");
                          setError(null);
                        }}
                      >
                        Edit
                      </Button>
                      <Button asChild size="sm" className="rounded-full px-3 py-1">
                        <Link href={`/analytics/binder?setId=${set.id}`}>Open</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--color-text-heading)]">Create a Test Set</h3>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full border-brand-primary text-brand-primary hover:bg-brand-primary/5"
            >
              Quick create
            </Button>
          </div>
          <p className="mt-1 text-sm text-neutral-600">Select binder tests and jump straight to analytics.</p>
          <div className="mt-3">
            <TestSetInlineCreator
              onCreated={(id) => {
                router.push(`/analytics/binder?setId=${id}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
