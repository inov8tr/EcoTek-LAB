"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registerUser } from "@/app/actions/auth";

const initialState = { error: "", success: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Submitting..." : "Request access"}
    </button>
  );
}

export function SignupForm() {
  const hook = (React as typeof React & { useActionState?: typeof useFormState })
    .useActionState ?? useFormState;
  const [state, formAction] = hook(registerUser, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-semibold text-[var(--color-text-heading)]">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Jane Doe"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-[var(--color-text-heading)]">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@ecotek.com"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-[var(--color-text-heading)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Create a secure passphrase"
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
        />
      </div>
      {state.error && (
        <p className="text-sm font-medium text-[var(--color-status-fail-text)]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm font-medium text-[var(--color-status-pass-text)]">
          {state.success}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Requests are routed to the EcoTek admin team for approval.
      </p>
    </form>
  );
}
