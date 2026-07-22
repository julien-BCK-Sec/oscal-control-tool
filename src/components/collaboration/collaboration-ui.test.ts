import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMentionTokens } from "@/data/collaboration";

/**
 * Lightweight UI contract checks for mention autocomplete tokenization.
 * Full React UI is covered manually per the milestone verification list.
 */
describe("collaboration UI contracts (WP7)", () => {
  it("tokenizes mention prefixes used by MentionTextarea", () => {
    const tokens = extractMentionTokens("hi @alice.smith and @bob");
    assert.deepEqual(
      tokens.map((t) => t.token),
      ["alice.smith", "bob"],
    );
  });
});
