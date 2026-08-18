/**
 * In-memory Help search over the parsed Markdown manifest.
 * No index service: the guide is small enough to scan in the browser.
 */

export type HelpSearchDocument = {
  slug: string;
  title: string;
  summary: string;
  sectionLabel: string;
  headings: Array<{ id: string; text: string }>;
  bodyText: string;
};

export type HelpSearchHit = {
  slug: string;
  title: string;
  href: string;
  heading: string | null;
  excerpt: string;
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "between",
  "does",
  "for",
  "how",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "with",
]);

function tokenize(query: string): string[] {
  const raw = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const significant = raw.filter((token) => !STOPWORDS.has(token));
  return significant.length > 0 ? significant : raw;
}

function firstMatchIndex(haystack: string, tokens: string[]): number {
  const lower = haystack.toLowerCase();
  let best = -1;
  for (const token of tokens) {
    const index = lower.indexOf(token);
    if (index !== -1 && (best === -1 || index < best)) {
      best = index;
    }
  }
  return best;
}

function makeExcerpt(text: string, tokens: string[], maxLength = 160): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) {
    return "";
  }
  const index = firstMatchIndex(collapsed, tokens);
  if (index === -1) {
    return collapsed.length > maxLength
      ? `${collapsed.slice(0, maxLength).trimEnd()}…`
      : collapsed;
  }
  const start = Math.max(0, index - 40);
  const slice = collapsed.slice(start, start + maxLength).trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = start + maxLength < collapsed.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

function scoreDocument(doc: HelpSearchDocument, tokens: string[]): number {
  const title = doc.title.toLowerCase();
  const summary = doc.summary.toLowerCase();
  const headingText = doc.headings.map((heading) => heading.text.toLowerCase()).join(" ");
  const body = doc.bodyText.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 8;
    if (summary.includes(token)) score += 4;
    if (headingText.includes(token)) score += 3;
    if (body.includes(token)) score += 1;
  }
  return score;
}

/**
 * Match title, summary, headings, and body. All significant tokens must
 * appear somewhere in the document.
 */
export function searchHelp(
  documents: HelpSearchDocument[],
  query: string,
): HelpSearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  const hits: Array<HelpSearchHit & { score: number }> = [];

  for (const doc of documents) {
    const haystack = `${doc.title}\n${doc.summary}\n${doc.headings
      .map((heading) => heading.text)
      .join("\n")}\n${doc.bodyText}`.toLowerCase();
    if (!tokens.every((token) => haystack.includes(token))) {
      continue;
    }

    const matchingHeading =
      doc.headings.find((heading) => {
        const text = heading.text.toLowerCase();
        return tokens.some((token) => text.includes(token));
      }) ?? null;

    hits.push({
      slug: doc.slug,
      title: doc.title,
      href: matchingHeading
        ? `/help/${doc.slug}#${matchingHeading.id}`
        : `/help/${doc.slug}`,
      heading: matchingHeading?.text ?? null,
      excerpt: makeExcerpt(`${doc.summary}\n${doc.bodyText}`, tokens) || doc.summary,
      score: scoreDocument(doc, tokens),
    });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .map((hit) => ({
      slug: hit.slug,
      title: hit.title,
      href: hit.href,
      heading: hit.heading,
      excerpt: hit.excerpt,
    }));
}
