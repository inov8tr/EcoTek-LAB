import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChartCard } from "@/components/ui/chart-card";
import type { ReactNode } from "react";

async function loadUserGuide() {
  const filePath = path.join(process.cwd(), "docs", "user-guide.md");
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export default async function UserGuidePage() {
  const guide = await loadUserGuide();
  if (!guide) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--color-text-muted)]">
          Resources
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-heading)]">
          EcoTek Portal User Guide
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Rendered directly from <code>docs/user-guide.md</code>. Edit that file
          to update this page.
        </p>
      </div>

      <ChartCard title="Guide Contents" description="Rendered directly from docs/user-guide.md.">
        <article className="space-y-4 text-sm text-[var(--color-text-main)]">
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
            {guide}
          </ReactMarkdown>
        </article>
      </ChartCard>
    </div>
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold text-[var(--color-text-heading)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold text-[var(--color-text-heading)]">{children}</h3>
  ),
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ inline, children }: { inline?: boolean; children?: ReactNode }) =>
    inline ? (
      <code className="rounded bg-[var(--color-bg-alt)]/80 px-1 py-0.5 text-xs font-semibold">{children}</code>
    ) : (
      <pre className="overflow-x-auto rounded-xl bg-[var(--color-bg-alt)]/80 p-4 text-xs leading-relaxed">
        <code>{children}</code>
      </pre>
    ),
  hr: () => <hr className="my-6 border-dashed border-[var(--color-border-subtle)]" />,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse rounded-xl border border-border text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--color-bg-alt)] text-[var(--color-text-heading)]">{children}</thead>
  ),
  th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--color-accent-primary)] bg-[var(--color-bg-alt)]/50 px-4 py-2 italic">
      {children}
    </blockquote>
  ),
};
