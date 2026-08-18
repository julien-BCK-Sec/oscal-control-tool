"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
 * filter. The guide is small enough that a substring filter over titles and
 * summaries is proportionate — no search index or dependency.
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
    <nav aria-label="Help topics" className="lg:w-64 lg:shrink-0">
      <label htmlFor="help-nav-search" className="label">
        Search the guide
      </label>
      <input
        id="help-nav-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter topics…"
        className="field mt-1.5"
      />

      <div className="mt-4 space-y-5">
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
                        className={`block rounded-sm px-2 py-1 text-sm leading-snug ${
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
    </nav>
  );
}
