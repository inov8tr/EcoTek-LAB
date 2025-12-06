"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { PMAFormulaEditor } from "@/components/pma/PMAFormulaEditor";

type Option = { id: string; label: string };

export default function NewPmaPage() {
  const router = useRouter();
  const [capsules, setCapsules] = useState<Option[]>([]);
  const [origins, setOrigins] = useState<Option[]>([]);
  const [testsByOrigin, setTestsByOrigin] = useState<Record<string, Option[]>>({});

  useEffect(() => {
    async function loadData() {
      const [capsuleRes, originRes] = await Promise.all([
        fetch("/api/capsules"),
        fetch("/api/bitumen-origins"),
      ]);
      if (capsuleRes.ok) {
        const data: { id: string; name: string }[] = await capsuleRes.json();
        setCapsules(data.map((c) => ({ id: c.id, label: c.name })));
      }
      if (originRes.ok) {
        const data: { id: string; refineryName: string }[] = await originRes.json();
        setOrigins(data.map((o) => ({ id: o.id, label: o.refineryName })));
        // load tests for each origin
        const testsRecord: Record<string, Option[]> = {};
        for (const origin of data) {
          const testRes = await fetch(`/api/bitumen-tests?originId=${origin.id}`);
          if (testRes.ok) {
            const tests: { id: string; batchCode: string }[] = await testRes.json();
            testsRecord[origin.id] = tests.map((t) => ({
              id: t.id,
              label: t.batchCode,
            }));
          }
        }
        setTestsByOrigin(testsRecord);
      }
    }
    loadData();
  }, []);

  async function handleSubmit(payload: {
    name: string;
    capsuleFormulaId: string;
    bitumenOriginId: string;
    bitumenTestId?: string | null;
    ecoCapPercentage: number;
    reagentPercentage: number;
    mixRpm?: number;
    mixTimeMinutes?: number;
    targetPgHigh?: number;
    targetPgLow?: number;
    bitumenGradeOverride?: string;
    notes?: string;
  }) {
    const res = await fetch("/api/pma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Failed to create PMA formula", await res.text());
      return;
    }
    router.push("/pma" as Route);
  }

  if (!capsules.length || !origins.length) {
    return <p className="text-[var(--color-text-muted)]">Load capsule and bitumen data first.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Create PMA Formula</h1>
        <p className="text-[var(--color-text-muted)]">
          Link capsule, bitumen origin, and optional base test, then set mix parameters.
        </p>
      </div>
      <PMAFormulaEditor
        capsuleOptions={capsules}
        originOptions={origins}
        testOptionsByOrigin={testsByOrigin}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
