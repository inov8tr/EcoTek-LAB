import Link from "next/link";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { ViewModeGate } from "@/components/view-mode/view-mode-gate";
import { MaterialInputs } from "@/components/formulations/material-inputs";

export default function NewFormulationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Create Formulation</h1>
        <p className="text-[var(--color-text-muted)]">
          Define the capsule parameters, material ratios, and metadata for a new EcoTek formulation.
        </p>
      </div>

      <ViewModeGate
        minRole="RESEARCHER"
        fallback={
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            This action is unavailable in Viewer Mode.
          </p>
        }
      >
        <form className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <DashboardCard
              title="Formulation Details"
              description="Capture essential metadata and performance targets before validating batches."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Formulation Code" placeholder="e.g. F-12A" name="code" />
                <FormField label="Bitumen Grade" placeholder="PG 82-22" name="bitumen" />
                <FormField label="EcoCap %" placeholder="12" name="ecoCap" type="number" step={0.1} />
                <FormField
                  label="Reagent %"
                  placeholder="1.0"
                  name="reagent"
                  type="number"
                  step={0.1}
                />
              </div>

              <label className="mt-4 block space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
                Notes
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Describe target performance, materials, and mixing assumptions..."
                  className="w-full rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </label>
            </DashboardCard>

            <DashboardCard
              title="Materials & Ratios"
              description="List all capsule materials and their percentages (max 10 rows)."
            >
              <MaterialInputs />
            </DashboardCard>
          </div>

          <DashboardCard className="bg-[var(--color-bg-alt)]/60">
            <div className="flex flex-wrap gap-3">
              <Button disabled>Save Draft</Button>
              <Button asChild variant="outline">
                <Link href="/formulations">Cancel</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Note: Form submission is disabled while the backend workflow for persisting formulations is
              finalized. Capture details here and coordinate with the platform team to ingest it.
            </p>
          </DashboardCard>
        </form>
      </ViewModeGate>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  step?: number;
};

function FormField({ label, name, placeholder, type = "text", step }: FormFieldProps) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--color-text-heading)]">
      {label}
      <input
        type={type}
        step={step}
        name={name}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border-subtle bg-white px-4 py-2 text-sm text-[var(--color-text-heading)] focus:border-[var(--color-accent-primary)] focus:outline-none"
      />
    </label>
  );
}
