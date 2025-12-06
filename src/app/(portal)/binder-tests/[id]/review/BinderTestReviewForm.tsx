"use client";

import { useTransition, useState } from "react";
import { saveBinderTestReview } from "./actions";
import type { BinderTestExtractedData, BinderTestValueSources } from "@/lib/binder/types";

type BinderTestReviewProps = {
  binderTest: {
    id: string;
    lab?: string | null;
    binderSource?: string | null;
    name?: string | null;
    testName?: string | null;
    aiExtractedData?: { data?: BinderTestExtractedData; sources?: BinderTestValueSources } | null;
  } & Partial<BinderTestExtractedData>;
};

type FieldConfig = { key: keyof BinderTestExtractedData; label: string; type?: "text" | "number"; helper?: string };

const fieldGroups: { title: string; description?: string; fields: FieldConfig[] }[] = [
  {
    title: "Performance Grade",
    fields: [
      { key: "performanceGrade", label: "Performance Grade (e.g., PG 82-22)", type: "text" },
      { key: "pgHigh", label: "PG High (°C)", type: "number" },
      { key: "pgLow", label: "PG Low (°C)", type: "number" },
    ],
  },
  {
    title: "Basic Physical Properties",
    fields: [
      { key: "flashPointCOC_C", label: "Flash Point COC (°C)", type: "number" },
      { key: "softeningPointC", label: "Softening Point (°C)", type: "number" },
      { key: "viscosity155_PaS", label: "Viscosity @155°C (Pa·s)", type: "number" },
      { key: "viscosity155_cP", label: "Viscosity @155°C (cP)", type: "number", helper: "Auto-converts vs Pa·s when possible" },
    ],
  },
  {
    title: "DSR (High Temp)",
    fields: [
      { key: "dsr_original_82C_kPa", label: "Original DSR @82°C (kPa)", type: "number" },
      { key: "rtfo_massChange_pct", label: "RTFO Mass Change (%)", type: "number" },
      { key: "dsr_rtfo_82C_kPa", label: "RTFO DSR @82°C (kPa)", type: "number" },
      { key: "dsr_pav_34C_kPa", label: "PAV DSR @34°C (kPa)", type: "number" },
    ],
  },
  {
    title: "BBR (Low Temp)",
    fields: [
      { key: "bbr_stiffness_minus12C_MPa", label: "BBR Stiffness @-12°C (MPa)", type: "number" },
      { key: "bbr_mValue_minus12C", label: "BBR m-Value @-12°C", type: "number" },
    ],
  },
  {
    title: "MSCR",
    fields: [
      { key: "mscr_jnr_3_2_kPa_inv", label: "MSCR Jnr @3.2 kPa⁻¹", type: "number" },
      { key: "mscr_percentRecovery_64C_pct", label: "MSCR % Recovery @64°C (%)", type: "number" },
      { key: "mscr_percentRecoveryOverall_pct", label: "Percent Recovery Overall (%)", type: "number" },
      { key: "jnr_3_2", label: "Legacy Jnr @3.2 (kPa⁻¹)", type: "number" },
      { key: "recoveryPct", label: "Legacy Recovery (%)", type: "number" },
      { key: "ductilityCm", label: "Ductility (cm)", type: "number" },
    ],
  },
  {
    title: "Metadata",
    fields: [
      { key: "testingLocation", label: "Testing Location", type: "text" },
      { key: "testReportNumber", label: "Test Report Number", type: "text" },
      { key: "sampleName", label: "Sample / Binder Name", type: "text" },
      { key: "testDate", label: "Test Date", type: "text", helper: "Enter as shown on report" },
      { key: "labName", label: "Lab Name", type: "text" },
    ],
  },
];

export function BinderTestReviewForm({ binderTest }: BinderTestReviewProps) {
  const [isPending, startTransition] = useTransition();
  const aiData = binderTest.aiExtractedData?.data ?? {};
  const aiSources = binderTest.aiExtractedData?.sources ?? {};
  const [sources, setSources] = useState<BinderTestValueSources>(aiSources);

  function getValue(key: keyof BinderTestExtractedData) {
    const fromAi = (aiData as any)[key];
    if (fromAi !== null && fromAi !== undefined && fromAi !== "") return fromAi;
    const fromDb = (binderTest as any)[key];
    if (fromDb !== null && fromDb !== undefined && fromDb !== "") return fromDb;

    if (key === "performanceGrade" && binderTest.pgHigh && binderTest.pgLow) {
      return `PG ${binderTest.pgHigh}-${Math.abs(binderTest.pgLow as number)}`;
    }
    if (key === "labName" && (binderTest as any).lab) return (binderTest as any).lab;
    if (key === "sampleName") return (binderTest as any).name ?? (binderTest as any).binderSource ?? "";
    if (key === "viscosity155_PaS" && binderTest.viscosity155_cP) {
      const num = Number(binderTest.viscosity155_cP);
      return Number.isFinite(num) ? num / 1000 : "";
    }
    if (key === "mscr_jnr_3_2_kPa_inv" && binderTest.jnr_3_2 !== undefined) {
      return binderTest.jnr_3_2 ?? "";
    }
    if (key === "mscr_percentRecoveryOverall_pct" && binderTest.recoveryPct !== undefined) {
      return binderTest.recoveryPct ?? "";
    }
    return "";
  }

  function handleSubmit(formData: FormData) {
    formData.set("sources", JSON.stringify(sources));
    startTransition(async () => {
      await saveBinderTestReview(binderTest.id, formData);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="sources" value={JSON.stringify(sources)} readOnly />

      {fieldGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <div className="text-sm font-semibold">{group.title}</div>
          {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map(({ key, label, type = "text", helper }) => {
              const val = getValue(key);
              const source = sources[key];
              return (
                <label key={key} className="block text-sm">
                  <span className="font-medium flex items-center gap-2">
                    {label}
                    {source && (
                      <span className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
                        {source === "parser" && "Parsed"}
                        {source === "ai" && "AI"}
                        {source === "manual" && "Manual"}
                      </span>
                    )}
                  </span>
                  <input
                    name={key}
                    type={type === "number" ? "number" : "text"}
                    step={type === "number" ? "any" : undefined}
                    defaultValue={val ?? ""}
                    placeholder={helper}
                    onChange={() => setSources((prev) => ({ ...prev, [key]: "manual" }))}
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                  />
                  {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save & Mark as Ready"}
        </button>
      </div>
    </form>
  );
}
