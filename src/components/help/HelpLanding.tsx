"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormLabel,
} from "@/components/design-system";
import { HELP_LANDING_GROUPS } from "@/help/landing";
import { searchHelp, type HelpSearchDocument } from "@/help/search";
import type { HelpManifest } from "@/help/content";

export type HelpLandingProps = {
  sections: HelpManifest["sections"];
  searchIndex: HelpSearchDocument[];
};

const CARD_LINK_CLASS =
  "text-sm font-medium text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function HelpLanding({ sections, searchIndex }: HelpLandingProps) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed ? searchHelp(searchIndex, trimmed) : []),
    [searchIndex, trimmed],
  );

  return (
    <main id="help-main" className="mx-auto w-full max-w-[var(--layout-help-max)]">
      <header className="max-w-[46rem]">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          User guide
        </h1>
        <p className="mt-2 text-base leading-relaxed text-text-secondary">
          Learn how to create projects, document controls and requirements,
          manage Evidence, collaborate with reviewers, and work with supported
          frameworks.
        </p>
      </header>

      <div className="mt-6 max-w-[36rem]">
        <FormField>
          <FormLabel htmlFor="help-guide-search">Search the guide</FormLabel>
          <input
            id="help-guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, headings, and article text…"
            className="field mt-1.5"
          />
        </FormField>
      </div>

      {trimmed ? (
        <section className="mt-8" aria-live="polite" aria-label="Search results">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Search results
          </h2>
          {results.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              No articles match “{trimmed}”.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {results.map((hit) => (
                <li key={`${hit.slug}-${hit.href}`}>
                  <Link
                    href={hit.href}
                    className="block rounded-md border border-border bg-surface p-4 shadow-[var(--shadow-subtle)] hover:border-accent/40 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <p className="text-sm font-medium text-foreground">{hit.title}</p>
                    {hit.heading ? (
                      <p className="mt-0.5 text-xs text-text-muted">{hit.heading}</p>
                    ) : null}
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {hit.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <section className="mt-8" aria-labelledby="help-tasks-heading">
            <h2
              id="help-tasks-heading"
              className="text-sm font-semibold uppercase tracking-wide text-text-secondary"
            >
              Start with a task
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {HELP_LANDING_GROUPS.map((group) => (
                <Card
                  key={group.id}
                  variant="surface"
                  as="section"
                  aria-labelledby={`help-task-${group.id}`}
                >
                  <CardHeader>
                    <CardTitle id={`help-task-${group.id}`}>{group.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={`${group.id}-${item.href}-${item.label}`}>
                          <Link href={item.href} className={CARD_LINK_CLASS}>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-10" aria-labelledby="help-browse-heading">
            <h2
              id="help-browse-heading"
              className="text-sm font-semibold uppercase tracking-wide text-text-secondary"
            >
              Browse all topics
            </h2>
            <div className="mt-4 space-y-8">
              {sections.map(({ section, pages }) => (
                <section key={section.id} aria-labelledby={`section-${section.id}`}>
                  <h3
                    id={`section-${section.id}`}
                    className="text-base font-semibold tracking-tight text-foreground"
                  >
                    {section.label}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">{section.description}</p>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {pages.map((page) => (
                      <li key={page.slug}>
                        <Link
                          href={`/help/${page.slug}`}
                          className="block h-full rounded-md border border-border bg-surface p-4 shadow-[var(--shadow-subtle)] hover:border-accent/40 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {page.title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                            {page.summary}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
