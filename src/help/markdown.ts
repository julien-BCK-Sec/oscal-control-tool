/**
 * Deterministic, dependency-free Markdown subset parser for Help content.
 *
 * Supports exactly what the user-guide content needs: headings (#-####),
 * paragraphs, bold/italic/code/link inline spans, unordered/ordered lists
 * (single level), fenced code blocks, blockquotes (used as note callouts),
 * pipe tables, and horizontal rules. It is intentionally not a general
 * CommonMark implementation.
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] };

export type BlockNode =
  | {
      type: "heading";
      level: 1 | 2 | 3 | 4;
      id: string;
      text: string;
      children: InlineNode[];
    }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "code_block"; lang: string | null; code: string }
  | { type: "blockquote"; children: InlineNode[] }
  | {
      type: "table";
      header: InlineNode[][];
      align: Array<"left" | "center" | "right" | null>;
      rows: InlineNode[][][];
    }
  | { type: "hr" };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const INLINE_PATTERN = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;

  // `matchAll` clones the regex per call, so nested/recursive `parseInline`
  // calls (bold/italic contents) never clobber an outer scan's position —
  // unlike reusing a shared global regex's `lastIndex` via `.exec()`.
  for (const match of text.matchAll(INLINE_PATTERN)) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const [, code, bold, italic, linkText, linkHref] = match;
    if (code !== undefined) {
      nodes.push({ type: "code", value: code });
    } else if (bold !== undefined) {
      nodes.push({ type: "bold", children: parseInline(bold) });
    } else if (italic !== undefined) {
      nodes.push({ type: "italic", children: parseInline(italic) });
    } else if (linkText !== undefined && linkHref !== undefined) {
      nodes.push({
        type: "link",
        href: linkHref.trim(),
        children: parseInline(linkText),
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes;
}

function inlineText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text" || node.type === "code") {
        return node.value;
      }
      return inlineText(node.children);
    })
    .join("");
}

const UNORDERED_ITEM = /^[-*]\s+(.*)$/;
const ORDERED_ITEM = /^\d+\.\s+(.*)$/;
const TABLE_SEPARATOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith("|")) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseTableAlign(
  separatorCells: string[],
): Array<"left" | "center" | "right" | null> {
  return separatorCells.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });
}

export function parseMarkdown(source: string): BlockNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code block
    const fenceMatch = line.match(/^```\s*(\S*)\s*$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || null;
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push({ type: "code_block", lang, code: code.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*)\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4;
      const text = headingMatch[2].trim();
      const children = parseInline(text);
      blocks.push({
        type: "heading",
        level,
        id: slugifyHeading(inlineText(children)),
        text: inlineText(children),
        children,
      });
      i += 1;
      continue;
    }

    // Table: current line has a pipe and next line is a separator row
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      TABLE_SEPARATOR.test(lines[i + 1].trim())
    ) {
      const header = splitTableRow(line).map((cell) => parseInline(cell));
      const align = parseTableAlign(splitTableRow(lines[i + 1]));
      i += 2;
      const rows: InlineNode[][][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]).map((cell) => parseInline(cell)));
        i += 1;
      }
      blocks.push({ type: "table", header, align, rows });
      continue;
    }

    // Blockquote (single block of joined lines; used for note callouts)
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({
        type: "blockquote",
        children: parseInline(quoteLines.join(" ").trim()),
      });
      continue;
    }

    // List (unordered or ordered), single level, with indented continuation lines
    if (UNORDERED_ITEM.test(line) || ORDERED_ITEM.test(line)) {
      const ordered = ORDERED_ITEM.test(line);
      const itemPattern = ordered ? ORDERED_ITEM : UNORDERED_ITEM;
      const items: string[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].match(itemPattern);
        if (itemMatch) {
          items.push(itemMatch[1]);
          i += 1;
        } else if (lines[i].startsWith("  ") && lines[i].trim()) {
          items[items.length - 1] += ` ${lines[i].trim()}`;
          i += 1;
        } else {
          break;
        }
      }
      blocks.push({
        type: "list",
        ordered,
        items: items.map((item) => parseInline(item)),
      });
      continue;
    }

    // Paragraph: consecutive non-blank, non-special lines joined by spaces
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^(---|\*\*\*)\s*$/.test(lines[i].trim()) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !lines[i].startsWith(">") &&
      !UNORDERED_ITEM.test(lines[i]) &&
      !ORDERED_ITEM.test(lines[i])
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        children: parseInline(paragraphLines.join(" ")),
      });
      continue;
    }

    // Fallback: unrecognized line, skip to avoid an infinite loop
    i += 1;
  }

  return blocks;
}

export function extractHeadings(
  blocks: BlockNode[],
): Array<{ id: string; text: string; level: 1 | 2 | 3 | 4 }> {
  return blocks
    .filter((block): block is Extract<BlockNode, { type: "heading" }> =>
      block.type === "heading",
    )
    .map(({ id, text, level }) => ({ id, text, level }));
}
