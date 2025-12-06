"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/auth";

const initialState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-primary)]/90"
      disabled={pending}
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const hook = (React as typeof React & { useActionState?: typeof useFormState })
    .useActionState ?? useFormState;
  const [state, formAction] = hook(authenticate, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-[var(--color-text-heading)]">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="rd-lead@ecotek.com"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-[var(--color-text-heading)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="lab-demo-2025"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="totp" className="text-sm font-semibold text-[var(--color-text-heading)]">
          2FA code (if enabled)
        </label>
        <input
          id="totp"
          name="totp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="123456"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </div>
      {state?.error && (
        <p className="text-sm font-medium text-[var(--color-status-fail-text)]">{state.error}</p>
      )}
      <SubmitButton />
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Accounts require admin approval before they can sign in.
      </p>
    </form>
  );
}
