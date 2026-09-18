import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentTextFromValues,
  displayedAssignmentValue,
  persistAssignmentValues,
} from "./parameter-draft";

describe("assignment field draft vs persisted values", () => {
  it("trims persisted values without treating that round-trip as the live field", () => {
    assert.deepEqual(persistAssignmentValues("5 "), ["5"]);
    assert.deepEqual(persistAssignmentValues("15 minutes"), ["15 minutes"]);
    assert.equal(assignmentTextFromValues(["5"]), "5");
    assert.equal(
      displayedAssignmentValue(null, persistAssignmentValues("5 ")),
      "5",
    );
  });

  it("keeps a composing Space in the displayed value so typing is not blocked", () => {
    assert.equal(displayedAssignmentValue("5 ", ["5"]), "5 ");
    assert.equal(displayedAssignmentValue("15 minutes", ["15"]), "15 minutes");
    assert.equal(displayedAssignmentValue("", undefined), "");
  });
});
