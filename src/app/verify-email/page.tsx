"use client";

import { useEffect, useState } from "react";
import { verifyEmailToken } from "@/app/actions/security";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token ?? "";
  const [message, setMessage] = useState<string>("Verifying...");

  useEffect(() => {
    if (!token) {
      setMessage("Missing token.");
      return;
    }
    verifyEmailToken(token).then((res) => {
      setMessage(res.message);
    });
  }, [token]);

  return (
    <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-[var(--color-text-heading)]">Verify email</h1>
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}
