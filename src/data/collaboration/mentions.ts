/**
 * Mention parsing helpers (Milestone 02A WP3).
 *
 * Mentions use `@token` where token is a contiguous non-whitespace run after
 * `@`. Tokens are resolved against organization members by email local-part,
 * full email, or display name (case-insensitive). Mentions that do not resolve
 * to an org member are ignored (never create cross-tenant references).
 */

export const MENTIONS_PATTERN = /@([^\s@]+)/g;

export type MentionToken = {
  /** Raw token without the leading `@`. */
  token: string;
  /** Start index of `@` in the source body. */
  start: number;
  /** End index (exclusive) of the token in the source body. */
  end: number;
};

/** Extract unique mention tokens in document order. */
export function extractMentionTokens(body: string): MentionToken[] {
  const seen = new Set<string>();
  const tokens: MentionToken[] = [];
  const pattern = new RegExp(MENTIONS_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const token = match[1];
    const key = token.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    tokens.push({
      token,
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}
