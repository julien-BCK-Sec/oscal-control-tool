import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEvidenceListSelection } from "./selection";

describe("resolveEvidenceListSelection", () => {
  it("keeps a deep-linked Evidence id even when it is not on the current page", () => {
    assert.equal(
      resolveEvidenceListSelection({
        preserveId: "ev-focused",
        currentId: "ev-1",
        visibleIds: ["ev-1", "ev-2"],
      }),
      "ev-focused",
    );
  });

  it("keeps the current selection when it is still visible", () => {
    assert.equal(
      resolveEvidenceListSelection({
        currentId: "ev-2",
        visibleIds: ["ev-1", "ev-2", "ev-3"],
      }),
      "ev-2",
    );
  });

  it("falls back to the first visible item when the current id is gone", () => {
    assert.equal(
      resolveEvidenceListSelection({
        currentId: "ev-gone",
        visibleIds: ["ev-1", "ev-2"],
      }),
      "ev-1",
    );
    assert.equal(
      resolveEvidenceListSelection({
        currentId: null,
        visibleIds: [],
      }),
      null,
    );
  });
});
