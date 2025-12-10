"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { requestPasswordReset } from "@/app/actions/security";

type ResetRequestState =
  | { error: string; success?: undefined; link?: undefined }
  | { success: string; error?: undefined; link?: undefined }
  | { success: string; link: string; error?: undefined };

const initialState: ResetRequestState = { error: "" };

export default function ResetPasswordRequestPage() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-main)] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-[32px] border border-border bg-white/90 p-8 shadow-2xl shadow-indigo-100 backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-heading)]">Reset your password</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Enter your account email and we&apos;ll send a reset link.
          </p>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
        {state?.success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {state.success}
            {!state.link ? null : (
              <div className="mt-2 break-all text-xs text-green-900">
                Link (for testing): <code>{state.link}</code>
              </div>
            )}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">Work email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
              placeholder="you@company.com"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-primary)]/90"
          >
            Send reset link
          </button>
        </form>
        <div className="text-center text-sm text-[var(--color-text-muted)]">
          <Link href={"/login" as Route} className="text-[var(--color-text-link)] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
