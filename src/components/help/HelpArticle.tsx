import Link from "next/link";
import type { HelpHeading, HelpPage, HelpPageSummary } from "@/help/content";
import { HelpMarkdown } from "@/components/help/HelpMarkdown";

export type HelpArticleProps = {
  page: HelpPage;
  previous: HelpPageSummary | null;
  next: HelpPageSummary | null;
  related: HelpPageSummary[];
};

const TOC_LINK_CLASS =
  "text-sm text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function HelpOnThisPage({
  headings,
  variant,
}: {
  headings: HelpHeading[];
  variant: "inline" | "rail";
}) {
  if (headings.length === 0) {
    return null;
  }

  const list = (
    <ul className="mt-2 space-y-1.5">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`} className={TOC_LINK_CLASS}>
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "rail") {
    return (
      <aside
        aria-label="On this page"
        className="hidden w-52 shrink-0 xl:sticky xl:top-4 xl:block xl:max-h-[calc(100dvh-var(--product-header-height)-2rem)] xl:overflow-y-auto"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          On this page
        </p>
        {list}
      </aside>
    );
  }

  return (
    <details className="mt-5 rounded-md border border-border bg-surface px-4 py-3 xl:hidden">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
        On this page
      </summary>
      {list}
    </details>
  );
}

export function HelpArticle({ page, previous, next, related }: HelpArticleProps) {
  // Content pages use `##` for major sections (level 2); `#` is reserved for
  // the page title itself, which comes from frontmatter, not the body.
  const tocHeadings = page.headings.filter((heading) => heading.level === 2);

  return (
    <div className="flex min-w-0 flex-1 gap-8">
      <article id="help-main" className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="text-xs text-text-muted">
          <Link
            href="/help"
            className="hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            User guide
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{page.section.label}</span>
          <span aria-hidden="true"> / </span>
          <span className="text-text-secondary">{page.title}</span>
        </nav>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {page.title}
        </h1>
        {page.summary ? (
          <p className="mt-2 max-w-[var(--layout-help-prose)] text-base leading-relaxed text-text-secondary">
            {page.summary}
          </p>
        ) : null}

        {tocHeadings.length >= 2 ? (
          <HelpOnThisPage headings={tocHeadings} variant="inline" />
        ) : null}

        <div className="help-article-prose mt-6 border-t border-border pt-2">
          <HelpMarkdown blocks={page.blocks} />
        </div>

        {related.length > 0 ? (
          <div className="mt-10 max-w-[var(--layout-help-prose)] border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Related topics
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/help/${item.slug}`}
                    className="inline-block rounded-sm border border-border bg-surface px-2.5 py-1 text-sm text-accent hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {previous || next ? (
          <div className="mt-8 flex max-w-[var(--layout-help-prose)] items-center justify-between gap-4 border-t border-border pt-5 text-sm">
            {previous ? (
              <Link
                href={`/help/${previous.slug}`}
                className="min-w-0 text-left text-text-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
                className="min-w-0 text-right text-text-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <span className="block text-xs text-text-muted">Next</span>
                <span className="font-medium">{next.title}</span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </article>

      {tocHeadings.length >= 2 ? (
        <HelpOnThisPage headings={tocHeadings} variant="rail" />
      ) : null}
    </div>
  );
}
