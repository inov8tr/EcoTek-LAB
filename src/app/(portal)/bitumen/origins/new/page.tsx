"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { BitumenOriginEditor } from "@/components/bitumen/BitumenOriginEditor";

export default function NewBitumenOriginPage() {
  const router = useRouter();

  async function handleSubmit(payload: {
    refineryName: string;
    binderGrade: string;
    originCountry: string;
    description: string;
  }) {
    const res = await fetch("/api/bitumen-origins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Failed to create bitumen origin", await res.text());
      return;
    }
    router.push("/bitumen/origins" as Route);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Add Bitumen Origin</h1>
        <p className="text-[var(--color-text-muted)]">
          Capture refinery/source details and binder grade for this origin.
        </p>
      </div>
      <BitumenOriginEditor onSubmit={handleSubmit} />
    </div>
  );
}
