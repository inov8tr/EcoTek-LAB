import Link from "next/link";
import type { Route } from "next";
import { LoginForm } from "@/components/auth/login-form";

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Your account is still pending admin approval.",
  suspended: "This account has been suspended. Contact an administrator.",
  inactive: "Your session is inactive. Please contact an administrator.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; message?: string }>;
}) {
  const resolvedParams = await searchParams;
  const redirectTo = resolvedParams?.from ? decodeURIComponent(resolvedParams.from) : "/dashboard";
  const statusMessage =
    resolvedParams?.message && STATUS_MESSAGES[resolvedParams.message]
      ? STATUS_MESSAGES[resolvedParams.message]
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-main)] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-[32px] border border-border bg-white/90 p-8 shadow-2xl shadow-indigo-100 backdrop-blur">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
            EcoTek R&D Portal
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-text-heading)]">
            Sign in
          </h1>
          <p className="text-sm text-[var(--color-text-main)]">
            Authenticate to access dashboards, formulations, and analytics.
          </p>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-[var(--color-status-fail-bg)] bg-[var(--color-status-fail-bg)]/40 px-4 py-3 text-sm text-[var(--color-status-fail-text)]">
            {statusMessage}
          </div>
        )}

        <LoginForm redirectTo={redirectTo} />

        <div className="rounded-xl border border-dashed border-border bg-[var(--color-bg-alt)]/80 p-4 text-xs text-[var(--color-text-muted)] text-center">
          <p>
            Need access?{" "}
            <Link href={"https://lab.ecotek.green/signup" as Route} className="font-semibold text-[var(--color-text-link)]">
              Request an account
            </Link>
            .
          </p>
          <p className="mt-2">
            Forgot password?{" "}
            <Link href={"https://lab.ecotek.green/reset-password" as Route} className="font-semibold text-[var(--color-text-link)]">
              Reset it here
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
