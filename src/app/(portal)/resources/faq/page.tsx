const FAQS = [
  {
    q: "How do I enable 2FA?",
    a: "Go to Settings → Security, generate a secret, scan the QR in your authenticator app, and verify a code. Save recovery codes.",
  },
  {
    q: "How do I reset my password?",
    a: "Use the Reset Password link on the sign-in page. You’ll get an email with a token to set a new password.",
  },
  {
    q: "Where do I upload binder test documents?",
    a: "Open Binder Tests, pick a test, then use the Documents page for uploads. Data review and documents are kept separate.",
  },
  {
    q: "How do I export data?",
    a: "Most tables have an Export CSV action (Binder Tests, Batches, Users, Admin DB tables). Filters apply to exports.",
  },
  {
    q: "How do I contact support?",
    a: "Use Resources → Support to submit a request. Mark urgent issues and include steps to reproduce.",
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Help</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">Frequently Asked Questions</h1>
        <p className="text-[var(--color-text-muted)]">Quick answers to common portal questions.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-heading)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]">
              {item.q}
            </summary>
            <p className="mt-2 text-sm text-[var(--color-text-main)]">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
