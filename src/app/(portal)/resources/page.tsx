import { Info } from "lucide-react";
import { ChartCard } from "@/components/ui/chart-card";

const resourceSections = [
  {
    title: "Portal User Guide",
    description:
      "Step-by-step onboarding guide that explains authentication, navigation, workflows, and admin responsibilities.",
    links: [
      {
        label: "Read online",
        note: "Render-friendly version inside the portal",
        href: "/resources/user-guide",
      },
    ],
    details: [
      "Covers the full formulation → batch → binder test workflow.",
      "Documents the View Mode switcher, attachments, and archive rules.",
      "Includes environment variables, seed scripts, and deployment tips.",
    ],
  },
  {
    title: "Support",
    description: "Reach the team with issues, feature requests, or bug reports.",
    links: [
      {
        label: "Contact support",
        note: "Submit a request; we reply by email",
        href: "/resources/support",
      },
    ],
    details: [
      "Mark urgent issues for faster triage.",
      "Include steps to reproduce and impacted data.",
      "We log requests and notify admins.",
    ],
  },
  {
    title: "FAQ",
    description: "Quick answers to common questions about the portal.",
    links: [
      {
        label: "View FAQs",
        note: "Troubleshooting and how-tos",
        href: "/resources/faq",
      },
    ],
    details: [
      "2FA setup and recovery codes",
      "Password reset steps",
      "Where to upload documents and export data",
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
          <Info className="h-4 w-4 text-[var(--color-text-link)]" />
          Resources
        </p>
        <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">
          Guides & Reference
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Centralize onboarding docs so admins and researchers can move fast.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {resourceSections.map((section) => (
          <ChartCard
            key={section.title}
            title={section.title}
            description={section.description}
          >
            <ul className="space-y-2 text-sm text-[var(--color-text-main)]">
              {section.details.map((detail) => (
                <li key={detail} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-accent-primary)]" />
                  {detail}
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2">
              {section.links.map((link) => (
                <div
                  key={link.label}
                  className="flex flex-col rounded-xl border border-border bg-[var(--color-bg-alt)]/60 p-3 text-sm"
                >
                  <span className="font-semibold text-[var(--color-text-heading)]">
                    {link.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {link.note}
                  </span>
                  <a
                    href={link.href}
                    className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-link)]"
                  >
                    Open →
                  </a>
                </div>
              ))}
            </div>
          </ChartCard>
        ))}
      </section>
    </div>
  );
}
