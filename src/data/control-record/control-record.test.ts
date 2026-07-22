import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  controlImplementationStatusLabel,
  displayControlOwner,
  isControlOwnerUnassigned,
  isControlImplementationStatus,
  parseControlRecordReviewDueDate,
  parseUpsertControlRecordInput,
  resolveControlRecordFields,
} from "@/data/control-record";

describe("control-record domain helpers", () => {
  it("validates implementation status enum values", () => {
    assert.equal(isControlImplementationStatus("draft"), true);
    assert.equal(isControlImplementationStatus("in_review"), true);
    assert.equal(isControlImplementationStatus("implemented"), true);
    assert.equal(isControlImplementationStatus("in-progress"), false);
    assert.equal(isControlImplementationStatus("not-started"), false);
  });

  it("maps implementation status labels for UI", () => {
    assert.equal(controlImplementationStatusLabel("draft"), "Draft");
    assert.equal(controlImplementationStatusLabel("in_review"), "In Review");
    assert.equal(controlImplementationStatusLabel("approved"), "Approved");
    assert.equal(
      controlImplementationStatusLabel("implemented"),
      "Implemented",
    );
    assert.equal(controlImplementationStatusLabel("deprecated"), "Deprecated");
  });

  it("treats empty owner as unassigned", () => {
    assert.equal(isControlOwnerUnassigned(""), true);
    assert.equal(isControlOwnerUnassigned("  "), true);
    assert.equal(isControlOwnerUnassigned("Priya"), false);
    assert.equal(displayControlOwner(""), "Unassigned");
    assert.equal(displayControlOwner("Priya"), "Priya");
  });

  it("parses review due dates", () => {
    assert.equal(parseControlRecordReviewDueDate(""), null);
    assert.equal(parseControlRecordReviewDueDate(null), null);
    assert.equal(parseControlRecordReviewDueDate("2026-07-22"), "2026-07-22");
    assert.equal(parseControlRecordReviewDueDate("2026-13-01"), undefined);
    assert.equal(parseControlRecordReviewDueDate("07/22/2026"), undefined);
  });

  it("parses upsert input", () => {
    const parsed = parseUpsertControlRecordInput({
      controlId: "ac-2",
      owner: "A",
      coOwner: "B",
      businessUnit: "C",
      implementationStatus: "approved",
      reviewDueDate: "2026-08-01",
    });
    assert.ok(parsed);
    assert.equal(parsed?.controlId, "ac-2");
    assert.equal(parsed?.implementationStatus, "approved");
    assert.equal(
      parseUpsertControlRecordInput({
        controlId: "ac-2",
        owner: "A",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "bogus",
        reviewDueDate: null,
      }),
      null,
    );
  });

  it("resolves missing records to defaults", () => {
    assert.deepEqual(
      resolveControlRecordFields({}, "ac-99"),
      DEFAULT_CONTROL_RECORD_FIELDS,
    );
  });
});
