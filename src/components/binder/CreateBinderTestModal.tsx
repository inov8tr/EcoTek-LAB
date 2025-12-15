"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = { compact?: boolean };

type Option = { id: string; label: string };

export function CreateBinderTestModal({ compact }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchOptions, setBatchOptions] = useState<Option[]>([]);
  const [originOptions, setOriginOptions] = useState<Option[]>([]);
  const [capsuleOptions, setCapsuleOptions] = useState<Option[]>([]);
  const [form, setForm] = useState({
    pmaTestBatchId: "",
    bitumenOriginId: "",
    capsuleFormulaId: "",
    modifierPercentage: "",
    conditioning: "",
    notes: "",
  });
  const router = useRouter();

  useEffect(() => {
    async function loadOptions() {
      try {
        const [batchRes, originRes, capsuleRes] = await Promise.all([
          fetch("/api/pma/batches"),
          fetch("/api/bitumen-origins"),
          fetch("/api/capsules"),
        ]);
        const [batchData, originData, capsuleData] = await Promise.all([
          batchRes.ok ? batchRes.json() : [],
          originRes.ok ? originRes.json() : [],
          capsuleRes.ok ? capsuleRes.json() : [],
        ]);
        setBatchOptions(
          (batchData || []).map((b: any) => ({
            id: b.id,
            label: b.batchCode ?? b.id,
          })),
        );
        setOriginOptions(
          (originData || []).map((o: any) => ({
            id: o.id,
            label: o.refineryName ?? o.id,
          })),
        );
        setCapsuleOptions(
          (capsuleData || []).map((c: any) => ({
            id: c.id,
            label: c.name ?? c.id,
          })),
        );
      } catch (err) {
        console.error("Failed to load options", err);
      }
    }
    loadOptions();
  }, []);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/binder-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pmaTestBatchId: form.pmaTestBatchId,
          bitumenOriginId: form.bitumenOriginId,
          capsuleFormulaId: form.capsuleFormulaId,
          modifierPercentage: form.modifierPercentage ? Number(form.modifierPercentage) : undefined,
          conditioning: form.conditioning || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create binder test");
      }
      const created = await res.json();
      setOpen(false);
      router.push(`/binder-tests/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create binder test");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size={compact ? "sm" : "default"}
        className={!compact ? "rounded-full px-5 py-2 shadow-sm bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90" : ""}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Create Binder Test"}
      </Button>
      {open && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">Create Binder Test</h3>
          <div className="mt-3 space-y-3">
          <SelectField
            label="PMA Test Batch"
            value={form.pmaTestBatchId}
            options={batchOptions}
            onChange={(v) => setForm((f) => ({ ...f, pmaTestBatchId: v }))}
            placeholder="Select PMA batch"
          />
          <SelectField
            label="Bitumen Origin"
            value={form.bitumenOriginId}
            options={originOptions}
            onChange={(v) => setForm((f) => ({ ...f, bitumenOriginId: v }))}
            placeholder="Select origin"
          />
          <SelectField
            label="Capsule Formula"
            value={form.capsuleFormulaId}
            options={capsuleOptions}
            onChange={(v) => setForm((f) => ({ ...f, capsuleFormulaId: v }))}
            placeholder="Select capsule"
          />
            <TextField
              label="Modifier %"
              type="number"
              value={form.modifierPercentage}
              onChange={(v) => setForm((f) => ({ ...f, modifierPercentage: v }))}
            />
            <TextField
              label="Conditioning"
              value={form.conditioning}
              onChange={(v) => setForm((f) => ({ ...f, conditioning: v }))}
            />
            <TextArea
              label="Notes"
              value={form.notes}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />
            {error && <p className="text-sm font-semibold text-[var(--color-status-fail-text)]">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending || !form.pmaTestBatchId || !form.bitumenOriginId || !form.capsuleFormulaId}>
                {pending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-semibold text-[var(--color-text-heading)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-semibold text-[var(--color-text-heading)]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border px-3 py-2"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-semibold text-[var(--color-text-heading)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 bg-white"
      >
        <option value="">{placeholder ?? "Select"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
