import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTextOverflowing, overflowTooltipText } from "./overflowTitle";

describe("isTextOverflowing", () => {
  it("treats sub-pixel differences as not truncated", () => {
    assert.equal(
      isTextOverflowing({ scrollWidth: 120, clientWidth: 120 }),
      false,
    );
    assert.equal(
      isTextOverflowing({ scrollWidth: 121, clientWidth: 120 }),
      false,
    );
    assert.equal(
      isTextOverflowing({ scrollWidth: 122, clientWidth: 120 }),
      true,
    );
  });
});

describe("overflowTooltipText", () => {
  it("returns the full label only when truncated", () => {
    assert.equal(
      overflowTooltipText("Account Management", false),
      undefined,
    );
    assert.equal(
      overflowTooltipText("Account Management", true),
      "Account Management",
    );
    assert.equal(
      overflowTooltipText("Access Control Policy And Procedures", true),
      "Access Control Policy And Procedures",
    );
    assert.equal(overflowTooltipText("   ", true), undefined);
  });
});
