/**
 * Opaque keyset cursor for Evidence search (updatedAt DESC, id DESC).
 */

export type EvidenceSearchCursor = {
  updatedAt: string;
  id: string;
};

export function encodeEvidenceSearchCursor(cursor: EvidenceSearchCursor): string {
  const payload = JSON.stringify({
    u: cursor.updatedAt,
    i: cursor.id,
  });
  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeEvidenceSearchCursor(
  raw: string | null | undefined,
): EvidenceSearchCursor | null {
  if (!raw || raw.trim() === "") {
    return null;
  }
  try {
    const json = Buffer.from(raw.trim(), "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { u?: unknown; i?: unknown };
    if (
      typeof parsed.u !== "string" ||
      parsed.u.trim() === "" ||
      typeof parsed.i !== "string" ||
      parsed.i.trim() === ""
    ) {
      return null;
    }
    return { updatedAt: parsed.u, id: parsed.i };
  } catch {
    return null;
  }
}

/** Escape `%` and `_` for SQL ILIKE patterns. */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
