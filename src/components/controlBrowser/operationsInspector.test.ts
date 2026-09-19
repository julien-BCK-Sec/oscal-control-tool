import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  operationsInspectorSummary,
  parseOperationsInspectorExpanded,
} from "./operationsInspector";

describe("operations inspector presentation", () => {
  it("defaults closed and parses stored presentation flags", () => {
    assert.equal(parseOperationsInspectorExpanded(null), false);
    assert.equal(parseOperationsInspectorExpanded(""), false);
    assert.equal(parseOperationsInspectorExpanded("1"), true);
    assert.equal(parseOperationsInspectorExpanded("0"), false);
    assert.equal(parseOperationsInspectorExpanded("true"), true);
  });

  it("summarizes owner, implementation, and review without a compliance score", () => {
    assert.equal(
      operationsInspectorSummary({
        ownerLabel: "Alex Owner",
        implementationLabel: "In Review",
        reviewLabel: "Ready for Review",
      }),
      "Alex Owner · In Review · Ready for Review",
    );
  });
});
