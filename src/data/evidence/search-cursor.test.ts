import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeEvidenceSearchCursor,
  encodeEvidenceSearchCursor,
  escapeIlikePattern,
} from "./search-cursor";
import {
  EVIDENCE_SEARCH_DEFAULT_LIMIT,
  EVIDENCE_SEARCH_MAX_LIMIT,
} from "./search";

describe("evidence search cursor", () => {
  it("round-trips updatedAt and id", () => {
    const encoded = encodeEvidenceSearchCursor({
      updatedAt: "2026-07-24T12:00:00.000Z",
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });
    assert.equal(
      decodeEvidenceSearchCursor(encoded)?.updatedAt,
      "2026-07-24T12:00:00.000Z",
    );
    assert.equal(
      decodeEvidenceSearchCursor(encoded)?.id,
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
  });

  it("returns null for invalid cursors", () => {
    assert.equal(decodeEvidenceSearchCursor(null), null);
    assert.equal(decodeEvidenceSearchCursor(""), null);
    assert.equal(decodeEvidenceSearchCursor("not-base64"), null);
    assert.equal(
      decodeEvidenceSearchCursor(
        Buffer.from(JSON.stringify({ u: 1 }), "utf8").toString("base64url"),
      ),
      null,
    );
  });

  it("escapes ILIKE wildcards", () => {
    assert.equal(escapeIlikePattern("100%_done"), "100\\%\\_done");
  });

  it("exposes approved default and max page sizes", () => {
    assert.equal(EVIDENCE_SEARCH_DEFAULT_LIMIT, 20);
    assert.equal(EVIDENCE_SEARCH_MAX_LIMIT, 50);
  });
});
