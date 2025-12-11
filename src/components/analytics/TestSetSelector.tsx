"use client";

import { useEffect, useState } from "react";

interface TestSetSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
  initialSets?: any[];
}

export default function TestSetSelector({ value, onChange, initialSets = [] }: TestSetSelectorProps) {
  const [sets, setSets] = useState<any[]>(initialSets);

  useEffect(() => {
    if (initialSets.length) return;
    fetch("/api/analysis-sets/list")
      .then((res) => res.json())
      .then((json) => setSets(json.data ?? []))
      .catch(() => setSets([]));
  }, [initialSets.length]);

  useEffect(() => {
    if (initialSets.length) {
      setSets(initialSets);
    }
  }, [initialSets]);

  useEffect(() => {
    if (!value && sets.length) {
      onChange(String(sets[0].id));
    }
  }, [sets, value, onChange]);

  return (
    <div>
      <label className="text-sm font-medium">Test Set</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 w-full rounded-md border p-2 text-sm"
      >
        <option value="">Choose a Test Set</option>
        {sets?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
