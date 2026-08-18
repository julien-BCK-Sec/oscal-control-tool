/**
 * Minimal YAML-subset frontmatter parser for Help content.
 *
 * Supports only flat `key: value` string pairs delimited by `---` lines,
 * which is all the Help manifest needs. Not a general YAML parser.
 */
export type Frontmatter = Record<string, string>;

export type ParsedDocument = {
  data: Frontmatter;
  content: string;
};

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseFrontmatter(raw: string): ParsedDocument {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { data: {}, content: normalized };
  }

  const closingIndex = normalized.indexOf("\n---", 4);
  if (closingIndex === -1) {
    return { data: {}, content: normalized };
  }

  const rawFrontmatter = normalized.slice(4, closingIndex);
  const afterClose = normalized.slice(closingIndex + 4);
  const content = afterClose.startsWith("\n")
    ? afterClose.slice(1)
    : afterClose;

  const data: Frontmatter = {};
  for (const line of rawFrontmatter.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1));
    if (key) {
      data[key] = value;
    }
  }

  return { data, content };
}
