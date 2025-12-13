"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestSetInlineCreator({ onCreated }: { onCreated?: (id: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/binder-tests/list", { method: "GET" });
        const json = await res.json();
        setTests(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function create() {
    setError(null);
    try {
      const res = await fetch("/api/analysis-sets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          binderTestIds: selected,
        }),
      });

      if (!res.ok) {
        let message = `Failed to create test set (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
          if (data?.sample) message += ` — ${data.sample}`;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = await res.json();
      const newId = data?.data?.id as string | undefined;
      if (newId && onCreated) {
        onCreated(newId);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError((err as Error).message || "Failed to create test set");
    }
  }

  if (loading) {
    return <div className="text-sm text-neutral-600">Loading binder tests...</div>;
  }

  return (
    <div className="w-full max-w-xl space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Create a Test Set</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full rounded-md border p-2 text-sm"
            placeholder="Example: SBS Variation Study"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <input
            className="mt-1 w-full rounded-md border p-2 text-sm"
            placeholder="Optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Select Tests</label>
          <div className="h-40 overflow-y-auto rounded-md border p-2 text-sm">
            {tests.map((t: any) => (
              <label key={t.binderTestId} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selected.includes(String(t.binderTestId))}
                  onChange={() =>
                    setSelected((curr) =>
                      curr.includes(String(t.binderTestId))
                        ? curr.filter((x) => x !== String(t.binderTestId))
                        : [...curr, String(t.binderTestId)]
                    )
                  }
                />
                <span>
                  {t.batchCode ?? t.binderTestId} — {t.label} — SP {t.softeningPoint ?? "N/A"}°C
                </span>
              </label>
            ))}

            {tests.length === 0 && (
              <p className="text-sm text-neutral-500">
                No binder tests found. Add binder tests or link them to batches to use in analytics.
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <Button
          onClick={create}
          disabled={!name || selected.length === 0}
          className="w-full justify-center rounded-full bg-[var(--color-accent-primary)] px-5 py-2 text-white shadow-sm transition hover:bg-[var(--color-accent-primary)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-primary)] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          Create Test Set
        </Button>
      </div>
    </div>
  );
}
