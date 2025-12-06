import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { createBatch } from "./actions";
import { Button } from "@/components/ui/button";

export default async function NewBatchPage() {
  await requireRole([UserRole.ADMIN, UserRole.RESEARCHER]);
  const formulations = await prisma.formulation.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Create batch</h1>
        <p className="text-[var(--color-text-muted)]">
          Capture mixing conditions for a new EcoCap run before assigning binder tests.
        </p>
      </div>

      <form action={createBatch} className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">
              Formulation <span className="text-rose-500">*</span>
            </label>
            <select
              name="formulationId"
              required
              className="rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            >
              <option value="">Select formulation</option>
              {formulations.map((formula) => (
                <option key={formula.id} value={formula.id}>
                  {formula.code} — {formula.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">
              Batch code <span className="text-rose-500">*</span>
            </label>
            <input
              name="batchCode"
              required
              placeholder="B-301"
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">
              Mix date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="dateMixed"
              required
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Operator</label>
            <input
              name="operator"
              placeholder="Kim, J."
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">RPM</label>
            <input
              type="number"
              name="rpm"
              placeholder="420"
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Start temp (°C)</label>
            <input
              type="number"
              step="0.1"
              name="startTemp"
              placeholder="140"
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Final temp (°C)</label>
            <input
              type="number"
              step="0.1"
              name="finalTemp"
              placeholder="176"
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Duration (min)</label>
            <input
              type="number"
              name="duration"
              placeholder="75"
              className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
            />
          </div>
        </section>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--color-text-heading)]">Notes</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Describe any deviations, holds, or additives used during mixing."
            className="w-full rounded-2xl border border-border bg-[var(--color-bg-alt)] px-4 py-3 text-sm"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-6">
            Create batch
          </Button>
        </div>
      </form>
    </div>
  );
}
