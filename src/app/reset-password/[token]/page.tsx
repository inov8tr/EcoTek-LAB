"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { resetPassword } from "@/app/actions/security";

type ResetPasswordState =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined };

const initialState: ResetPasswordState = { error: "" };

export default function ResetPasswordTokenPage({ params }: { params: { token: string } }) {
  const [state, formAction] = useActionState(resetPassword, initialState);
  const token = params.token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-main)] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-[32px] border border-border bg-white/90 p-8 shadow-2xl shadow-indigo-100 backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-heading)]">Set a new password</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Enter a new password to finish resetting your account.</p>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
        {state?.success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {state.success}{" "}
            <Link href={"/login" as Route} className="font-semibold text-[var(--color-text-link)]">
              Sign in
            </Link>
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-text-heading)]">New password</label>
            <input
              name="newPassword"
              type="password"
              required
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
              placeholder="Choose a strong password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-primary)]/90"
          >
            Update password
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
