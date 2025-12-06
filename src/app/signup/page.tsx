import Link from "next/link";
import type { Route } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-main)] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-[32px] border border-border bg-white/90 p-8 shadow-2xl shadow-indigo-100 backdrop-blur">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
            EcoTek R&D Portal
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-text-heading)]">
            Request access
          </h1>
          <p className="text-sm text-[var(--color-text-main)]">
            Fill out the form below. An administrator will review and approve your access.
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Already have approval?{" "}
          <Link href={"/login" as Route} className="font-semibold text-[var(--color-text-link)]">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
