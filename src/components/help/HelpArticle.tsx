import Link from "next/link";
import type { HelpPage, HelpPageSummary } from "@/help/content";
import { HelpMarkdown } from "@/components/help/HelpMarkdown";

export type HelpArticleProps = {
  page: HelpPage;
  previous: HelpPageSummary | null;
  next: HelpPageSummary | null;
  related: HelpPageSummary[];
};

export function HelpArticle({ page, previous, next, related }: HelpArticleProps) {
  // Content pages use `##` for major sections (level 2); `#` is reserved for
  // the page title itself, which comes from frontmatter, not the body.
  const tocHeadings = page.headings.filter((heading) => heading.level === 2);

  return (
    <article className="min-w-0 flex-1">
      <nav aria-label="Breadcrumb" className="text-xs text-text-muted">
        <Link href="/help" className="hover:text-foreground hover:underline">
          Help
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{page.section.label}</span>
        <span aria-hidden="true"> / </span>
        <span className="text-text-secondary">{page.title}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {page.title}
      </h1>
      {page.summary ? (
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {page.summary}
        </p>
      ) : null}

      {tocHeadings.length >= 3 ? (
        <div className="mt-5 rounded-md border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            On this page
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {tocHeadings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className="text-accent hover:underline"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-2 max-w-[65ch]">
        <HelpMarkdown blocks={page.blocks} />
      </div>

      {related.length > 0 ? (
        <div className="mt-10 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Related topics
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/help/${item.slug}`}
                  className="inline-block rounded-sm border border-border bg-surface px-2.5 py-1 text-sm text-accent hover:bg-surface-secondary"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {previous || next ? (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5 text-sm">
          {previous ? (
            <Link
              href={`/help/${previous.slug}`}
              className="min-w-0 text-left text-text-secondary hover:text-foreground"
            >
              <span className="block text-xs text-text-muted">Previous</span>
              <span className="font-medium">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/help/${next.slug}`}
              className="min-w-0 text-right text-text-secondary hover:text-foreground"
            >
              <span className="block text-xs text-text-muted">Next</span>
              <span className="font-medium">{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </article>
  );
}
