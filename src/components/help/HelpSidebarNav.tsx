"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormField, FormLabel } from "@/components/design-system";
import type { HelpManifest } from "@/help/content";

export type HelpSidebarNavProps = {
  sections: HelpManifest["sections"];
  activeSlug: string | null;
};

function matches(query: string, ...values: string[]): boolean {
  if (!query) {
    return true;
  }
  const needle = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(needle));
}

/**
 * Guide navigation: grouped by section, with a lightweight client-side
 * filter over topic titles and summaries — not article body search.
 */
export function HelpSidebarNav({ sections, activeSlug }: HelpSidebarNavProps) {
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!query.trim()) {
      return sections;
    }
    return sections
      .map((entry) => ({
        section: entry.section,
        pages: entry.pages.filter((page) =>
          matches(query, page.title, page.summary, entry.section.label),
        ),
      }))
      .filter((entry) => entry.pages.length > 0);
  }, [sections, query]);

  return (
    <nav
      aria-label="Guide topics"
      className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:self-start lg:max-h-[calc(100dvh-var(--product-header-height)-2rem)] lg:overflow-y-auto"
    >
      <div className="rounded-md border border-border bg-surface p-3 lg:border-0 lg:bg-transparent lg:p-0">
        <FormField>
          <FormLabel htmlFor="help-nav-filter">Filter topics</FormLabel>
          <input
            id="help-nav-filter"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title…"
            className="field mt-1.5"
          />
        </FormField>

        <div className="mt-4 max-h-48 space-y-5 overflow-y-auto lg:max-h-none lg:overflow-visible">
          {filteredSections.length === 0 ? (
            <p className="text-xs text-text-muted">No topics match.</p>
          ) : (
            filteredSections.map(({ section, pages }) => (
              <div key={section.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {section.label}
                </p>
                <ul className="mt-2 space-y-1">
                  {pages.map((page) => {
                    const isActive = page.slug === activeSlug;
                    return (
                      <li key={page.slug}>
                        <Link
                          href={`/help/${page.slug}`}
                          aria-current={isActive ? "page" : undefined}
                          className={`block rounded-sm px-2 py-1 text-sm leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                            isActive
                              ? "bg-accent-muted font-medium text-accent"
                              : "text-text-secondary hover:bg-surface-secondary hover:text-foreground"
                          }`}
                        >
                          {page.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </nav>
  );
}
