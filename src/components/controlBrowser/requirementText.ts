/**
 * Presentation helpers for control requirement text.
 * Parameter insert tokens from the catalog are highlighted; source text is not altered.
 */

const PARAM_TOKEN =
  /\{\{\s*insert:\s*param,\s*([^}]+?)\s*\}\}/gi;

export type RequirementSegment =
  | { kind: "text"; value: string }
  | { kind: "param"; value: string; name: string };

export function splitRequirementSegments(statement: string): RequirementSegment[] {
  const segments: RequirementSegment[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(PARAM_TOKEN.source, PARAM_TOKEN.flags);

  for (const match of statement.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: "text", value: statement.slice(lastIndex, index) });
    }
    const name = match[1]?.trim() ?? "";
    segments.push({
      kind: "param",
      value: match[0],
      name,
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < statement.length) {
    segments.push({ kind: "text", value: statement.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ kind: "text", value: statement });
  }

  return segments;
}
