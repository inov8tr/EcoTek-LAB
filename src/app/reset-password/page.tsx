"use client";

import { resetPassword } from "@/app/actions/security";
import { useActionState } from "react";

const initialState = { error: "", success: "" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token ?? "";
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, formAction] = useActionState(resetPassword as any, initialState);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">Set a new password</h1>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="token" value={token} />
        <label className="block text-sm">
          <span className="font-medium text-[var(--color-text-heading)]">New password</span>
          <input
            name="newPassword"
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <button className="w-full rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white">
          Update password
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}
    </div>
  );
}
