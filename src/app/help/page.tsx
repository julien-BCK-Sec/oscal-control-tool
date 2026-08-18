import type { Metadata } from "next";
import Link from "next/link";
import { getHelpManifest } from "@/help/content";
import { HelpSidebarNav } from "@/components/help/HelpSidebarNav";

export const metadata: Metadata = {
  title: "Help",
};

export default function HelpIndexPage() {
  const manifest = getHelpManifest();

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-page-max)] flex-col gap-6 lg:flex-row lg:gap-8">
      <HelpSidebarNav sections={manifest.sections} activeSlug={null} />

      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          User guide
        </h1>
        <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-text-secondary">
          How to work with projects, controls, Evidence, and collaboration in
          Control Freak, organized around what you&rsquo;re trying to do. New
          here? Start with{" "}
          <Link
            href="/help/welcome"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Welcome to Control Freak
          </Link>
          .
        </p>

        <div className="mt-8 space-y-8">
          {manifest.sections.map(({ section, pages }) => (
            <section key={section.id} aria-labelledby={`section-${section.id}`}>
              <h2
                id={`section-${section.id}`}
                className="text-sm font-semibold uppercase tracking-wide text-text-secondary"
              >
                {section.label}
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                {section.description}
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {pages.map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/help/${page.slug}`}
                      className="block h-full rounded-md border border-border bg-surface p-4 shadow-[var(--shadow-subtle)] hover:border-accent/40 hover:bg-surface-secondary"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {page.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                        {page.summary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
