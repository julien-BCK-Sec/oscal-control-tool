/**
 * Presentation-only substitution of known overlay assignments into a catalog
 * statement. Does not mutate FrameworkControl.statement or persist results.
 * Not a general OSCAL parameter/modify engine.
 */

const PARAM_TOKEN = /\{\{\s*insert:\s*param,\s*([^}]+?)\s*\}\}/gi;

export type AssignmentFragment = {
  controlId: string;
  path: string[];
  values: string[];
  raw: string;
};

export type EffectiveRequirementResult = {
  text: string;
  substituted: boolean;
  appliedFragments: AssignmentFragment[];
  replacements: Array<{ start: number; end: number; value: string }>;
};

function tokenSpans(
  text: string,
  start: number,
  end: number,
): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  const region = text.slice(start, end);
  const pattern = new RegExp(PARAM_TOKEN.source, PARAM_TOKEN.flags);
  for (const match of region.matchAll(pattern)) {
    const index = match.index ?? 0;
    spans.push({
      start: start + index,
      end: start + index + match[0].length,
    });
  }
  return spans;
}

function markerMatches(
  region: string,
  pattern: RegExp,
): Array<{ key: string; index: number; length: number }> {
  const found: Array<{ key: string; index: number; length: number }> = [];
  const matcher = new RegExp(pattern.source, pattern.flags);
  for (const match of region.matchAll(matcher)) {
    if (match.index === undefined || !match[1]) {
      continue;
    }
    const newline = match[0].startsWith("\n") ? 1 : 0;
    found.push({
      key: match[1].toLowerCase(),
      index: match.index + newline,
      length: match[0].length - newline,
    });
  }
  return found;
}

function rangeForKey(
  statement: string,
  start: number,
  end: number,
  key: string,
): { start: number; end: number } | null {
  const region = statement.slice(start, end);
  const offset = start;
  const letterOrNumber = /^[a-z0-9]+$/.test(key);
  if (!letterOrNumber) {
    return null;
  }

  const numbered = /^\d+$/.test(key);
  const markers = numbered
    ? markerMatches(region, /(?:^|\n)(\d+)\.\s/g)
    : /[a-z]/.test(key) && key.length === 1
      ? markerMatches(region, /(?:^|\n)([a-z])\.\s/g)
      : markerMatches(region, new RegExp(`\\((${key})\\)`, "gi"));

  const found = markers.find((marker) => marker.key === key);
  if (!found) {
    return null;
  }
  const next = markers.find((marker) => marker.index > found.index);
  return {
    start: offset + found.index,
    end: next ? offset + next.index : end,
  };
}

export function statementRangeForPath(
  statement: string,
  path: string[],
): { start: number; end: number } | null {
  if (path.length === 0) {
    return { start: 0, end: statement.length };
  }
  let start = 0;
  let end = statement.length;
  for (const key of path) {
    const next = rangeForKey(statement, start, end, key);
    if (!next) {
      return null;
    }
    start = next.start;
    end = next.end;
  }
  return { start, end };
}

export function parseAssignmentFragments(text: string): AssignmentFragment[] {
  const fragments: AssignmentFragment[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const parsed = parseAssignmentLine(trimmed);
    if (parsed) {
      fragments.push(parsed);
    }
  }
  return fragments;
}

function parseAssignmentLine(line: string): AssignmentFragment | null {
  const header = line.match(/^([A-Za-z]{1,4}-\d+)(?:\s*\((\d+)\))?\s*(.*)$/);
  if (!header) {
    return null;
  }
  const base = header[1]?.toLowerCase() ?? "";
  const enhancement = header[2];
  const controlId = enhancement ? `${base}.${Number.parseInt(enhancement, 10)}` : base;
  let rest = header[3] ?? "";

  const path: string[] = [];
  const pathChunk = rest.match(/^((?:\s*\([A-Za-z0-9]+\)\s*)+)/);
  if (pathChunk) {
    for (const part of pathChunk[1].matchAll(/\(([A-Za-z0-9]+)\)/g)) {
      path.push(part[1].toLowerCase());
    }
    rest = rest.slice(pathChunk[0].length);
  }

  const values: string[] = [];
  for (const match of rest.matchAll(/\[([^\]]+)\]/g)) {
    const value = match[1]?.trim() ?? "";
    if (value) {
      values.push(value);
    }
  }
  if (values.length === 0) {
    return null;
  }
  return { controlId, path, values, raw: line };
}

function fragmentAppliesToControl(
  fragment: AssignmentFragment,
  controlId: string,
): boolean {
  return fragment.controlId === controlId.trim().toLowerCase();
}

/**
 * Substitute known assignment values into a copy of the catalog statement.
 * Remaining insert tokens are left untouched. Returns substituted=false when
 * nothing deterministic could be applied.
 */
export function substituteEffectiveRequirement(
  statement: string,
  assignmentText: string,
  controlId: string,
): EffectiveRequirementResult {
  const fragments = parseAssignmentFragments(assignmentText).filter((fragment) =>
    fragmentAppliesToControl(fragment, controlId),
  );
  if (fragments.length === 0) {
    return { text: statement, substituted: false, appliedFragments: [], replacements: [] };
  }

  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const applied: AssignmentFragment[] = [];

  for (const fragment of fragments) {
    const range = statementRangeForPath(statement, fragment.path);
    if (!range) {
      continue;
    }
    const spans = tokenSpans(statement, range.start, range.end);
    if (fragment.values.length === 0 || fragment.values.length > spans.length) {
      continue;
    }
    for (const [index, value] of fragment.values.entries()) {
      const span = spans[index];
      if (!span) {
        continue;
      }
      replacements.push({ start: span.start, end: span.end, value });
    }
    applied.push(fragment);
  }

  if (applied.length === 0) {
    return { text: statement, substituted: false, appliedFragments: [], replacements: [] };
  }

  replacements.sort((left, right) => left.start - right.start);
  let cursor = 0;
  let text = "";
  for (const replacement of replacements) {
    if (replacement.start < cursor) {
      continue;
    }
    text += statement.slice(cursor, replacement.start);
    text += replacement.value;
    cursor = replacement.end;
  }
  text += statement.slice(cursor);

  return {
    text,
    substituted: text !== statement,
    appliedFragments: applied,
    replacements,
  };
}

export function assignmentTextFullyInlined(
  assignmentText: string,
  applied: readonly AssignmentFragment[],
): boolean {
  const fragments = parseAssignmentFragments(assignmentText);
  if (fragments.length === 0) {
    return false;
  }
  const nonemptyLines = assignmentText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (nonemptyLines.length !== fragments.length) {
    return false;
  }
  const appliedRaws = new Set(applied.map((fragment) => fragment.raw));
  return fragments.every((fragment) => appliedRaws.has(fragment.raw));
}
