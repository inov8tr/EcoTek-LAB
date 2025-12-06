"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CapsuleFormulaEditor } from "@/components/capsules/CapsuleFormulaEditor";

export default function NewCapsulePage() {
  const router = useRouter();

  async function handleSubmit(payload: {
    name: string;
    description?: string;
    materials: { materialName: string; percentage: number }[];
  }) {
    const res = await fetch("/api/capsules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.push("/login" as Route);
        return;
      }
      console.error("Failed to create capsule", await res.text());
      return;
    }
    router.push("/capsules" as Route);
  }

  useEffect(() => {
    // Client-side access check: rely on API to enforce role; redirect to login on 401/403.
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Create Capsule</h1>
        <p className="text-[var(--color-text-muted)]">
          Define a capsule formula with material percentages totaling 100%.
        </p>
      </div>
      <CapsuleFormulaEditor onSubmit={handleSubmit} />
    </div>
  );
}
