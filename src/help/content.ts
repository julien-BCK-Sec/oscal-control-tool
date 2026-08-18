import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "@/help/frontmatter";
import {
  type BlockNode,
  extractHeadings,
  extractPlainText,
  parseMarkdown,
} from "@/help/markdown";
import { findHelpSection, HELP_SECTIONS, type HelpSection } from "@/help/sections";
import type { HelpSearchDocument } from "@/help/search";

export type HelpHeading = { id: string; text: string; level: 1 | 2 | 3 | 4 };

export type HelpPage = {
  slug: string;
  title: string;
  summary: string;
  section: HelpSection;
  order: number;
  related: string[];
  headings: HelpHeading[];
  blocks: BlockNode[];
};

export type HelpPageSummary = Pick<
  HelpPage,
  "slug" | "title" | "summary" | "section" | "order"
>;

export type HelpManifest = {
  sections: Array<{ section: HelpSection; pages: HelpPageSummary[] }>;
  /** All pages in reading order across every section, for prev/next links. */
  flat: HelpPageSummary[];
};

const CONTENT_DIR = path.join(process.cwd(), "docs", "user-guide");

function parseHelpFile(fileName: string, raw: string): HelpPage {
  const slug = fileName.replace(/\.md$/, "");
  const { data, content } = parseFrontmatter(raw);

  const sectionId = data.section;
  const section = sectionId ? findHelpSection(sectionId) : undefined;
  if (!section) {
    throw new Error(
      `Help page "${fileName}" has an unknown or missing "section" frontmatter field: ${
        sectionId ?? "(none)"
      }`,
    );
  }

  if (!data.title) {
    throw new Error(`Help page "${fileName}" is missing a "title" frontmatter field.`);
  }

  const order = Number.parseInt(data.order ?? "0", 10);
  const blocks = parseMarkdown(content);

  return {
    slug,
    title: data.title,
    summary: data.summary ?? "",
    section,
    order: Number.isFinite(order) ? order : 0,
    related: data.related
      ? data.related.split(",").map((entry) => entry.trim()).filter(Boolean)
      : [],
    headings: extractHeadings(blocks),
    blocks,
  };
}

function loadAllHelpPages(): HelpPage[] {
  let fileNames: string[];
  try {
    fileNames = readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".md"));
  } catch {
    return [];
  }

  const pages = fileNames.map((fileName) => {
    const raw = readFileSync(path.join(CONTENT_DIR, fileName), "utf8");
    return parseHelpFile(fileName, raw);
  });

  const seenSlugs = new Set<string>();
  for (const page of pages) {
    if (seenSlugs.has(page.slug)) {
      throw new Error(`Duplicate Help page slug: "${page.slug}"`);
    }
    seenSlugs.add(page.slug);
  }

  return pages.sort((a, b) => {
    if (a.section.order !== b.section.order) {
      return a.section.order - b.section.order;
    }
    return a.order - b.order;
  });
}

function toSummary(page: HelpPage): HelpPageSummary {
  const { slug, title, summary, section, order } = page;
  return { slug, title, summary, section, order };
}

export function getHelpManifest(): HelpManifest {
  const pages = loadAllHelpPages();
  const sections = HELP_SECTIONS.map((section) => ({
    section,
    pages: pages.filter((page) => page.section.id === section.id).map(toSummary),
  })).filter((entry) => entry.pages.length > 0);

  return { sections, flat: pages.map(toSummary) };
}

export function getHelpPage(slug: string): HelpPage | null {
  const pages = loadAllHelpPages();
  return pages.find((page) => page.slug === slug) ?? null;
}

export function getHelpSearchIndex(): HelpSearchDocument[] {
  return loadAllHelpPages().map((page) => ({
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    sectionLabel: page.section.label,
    headings: page.headings.map(({ id, text }) => ({ id, text })),
    bodyText: extractPlainText(page.blocks),
  }));
}

export function getAdjacentHelpPages(slug: string): {
  previous: HelpPageSummary | null;
  next: HelpPageSummary | null;
} {
  const { flat } = getHelpManifest();
  const index = flat.findIndex((page) => page.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }
  return {
    previous: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  };
}
