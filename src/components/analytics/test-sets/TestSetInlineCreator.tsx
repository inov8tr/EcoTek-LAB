"use client";

import { useEffect, useState } from "react";

export default function TestSetInlineCreator() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
    await fetch("/api/analysis-sets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        testResultIds: selected,
      }),
    });

    window.location.reload();
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
            {tests
              .filter((t: any) => t.testResultId)
              .map((t: any) => (
                <label key={t.binderTestId} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selected.includes(String(t.testResultId))}
                    onChange={() =>
                      setSelected((curr) =>
                        curr.includes(String(t.testResultId))
                          ? curr.filter((x) => x !== String(t.testResultId))
                          : [...curr, String(t.testResultId)]
                      )
                    }
                  />
                  <span>
                    {t.batchCode ?? t.binderTestId} — {t.label} — SP {t.softeningPoint ?? "N/A"}°C
                  </span>
                </label>
              ))}

            {tests.filter((t: any) => t.testResultId).length === 0 && (
              <p className="text-sm text-neutral-500">
                No binder tests with linked Test Results. Ensure your binder tests are linked to a
                batch with Test Results.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={create}
          disabled={!name || selected.length === 0}
          className="w-full rounded-md bg-brand-primary px-4 py-2 text-sm text-white disabled:bg-neutral-400"
        >
          Create Test Set
        </button>
      </div>
    </div>
  );
}
