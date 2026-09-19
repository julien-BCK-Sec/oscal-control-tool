import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authoringDisclosurePanelId,
  authoringDisclosureToggleLabel,
  nextAuthoringDisclosureExpanded,
} from "./disclosure";

describe("authoring disclosure helpers", () => {
  it("exposes a stable panel id and toggle labels", () => {
    assert.equal(
      authoringDisclosurePanelId("odp-heading"),
      "odp-heading-panel",
    );
    assert.equal(
      authoringDisclosureToggleLabel(false, "Show editors", "Hide editors"),
      "Show editors",
    );
    assert.equal(
      authoringDisclosureToggleLabel(true, "Show editors", "Hide editors"),
      "Hide editors",
    );
  });

  it("toggles on Enter and Space without treating other keys as activation", () => {
    assert.equal(nextAuthoringDisclosureExpanded(false, "Enter"), true);
    assert.equal(nextAuthoringDisclosureExpanded(false, " "), true);
    assert.equal(nextAuthoringDisclosureExpanded(true, "Spacebar"), false);
    assert.equal(nextAuthoringDisclosureExpanded(false, "Tab"), false);
    assert.equal(nextAuthoringDisclosureExpanded(true, "Escape"), true);
  });
});
