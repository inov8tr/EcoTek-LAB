 "use client";

import { requestPasswordReset } from "@/app/actions/security";
import { useActionState } from "react";

const initialState = { error: "", success: "", link: "" };

export default function ForgotPasswordPage() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, formAction] = useActionState(requestPasswordReset as any, initialState);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">Reset your password</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        Enter your email to generate a reset link. Copy the link to reset your password.
      </p>
      <form action={formAction} className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-[var(--color-text-heading)]">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <button className="w-full rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
          Generate reset link
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <div className="space-y-1 rounded-lg bg-[var(--color-bg-alt)] p-3 text-sm">
          <p className="font-semibold text-[var(--color-text-heading)]">{state.success}</p>
          {state.link && (
            <p className="break-all text-[var(--color-text-muted)]">
              Reset link: <code>{state.link}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
