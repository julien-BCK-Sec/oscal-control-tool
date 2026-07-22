import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  controlImplementationStatusLabel,
  controlReviewStatusLabel,
  displayControlOwner,
  isControlOwnerUnassigned,
  isControlImplementationStatus,
  isControlReviewStatus,
  parseControlRecordReviewDueDate,
  parseUpsertControlRecordInput,
  resolveControlRecordFields,
  resolveControlReviewStatus,
} from "@/data/control-record";

describe("control-record domain helpers", () => {
  it("validates implementation status enum values", () => {
    assert.equal(isControlImplementationStatus("draft"), true);
    assert.equal(isControlImplementationStatus("in_review"), true);
    assert.equal(isControlImplementationStatus("implemented"), true);
    assert.equal(isControlImplementationStatus("in-progress"), false);
    assert.equal(isControlImplementationStatus("not-started"), false);
  });

  it("validates review status enum values", () => {
    assert.equal(isControlReviewStatus("not_reviewed"), true);
    assert.equal(isControlReviewStatus("ready_for_review"), true);
    assert.equal(isControlReviewStatus("under_review"), true);
    assert.equal(isControlReviewStatus("changes_requested"), true);
    assert.equal(isControlReviewStatus("approved"), true);
    assert.equal(isControlReviewStatus("in_review"), false);
    assert.equal(isControlReviewStatus("draft"), false);
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

  it("maps review status labels for UI", () => {
    assert.equal(controlReviewStatusLabel("not_reviewed"), "Not Reviewed");
    assert.equal(
      controlReviewStatusLabel("ready_for_review"),
      "Ready for Review",
    );
    assert.equal(controlReviewStatusLabel("under_review"), "Under Review");
    assert.equal(
      controlReviewStatusLabel("changes_requested"),
      "Changes Requested",
    );
    assert.equal(controlReviewStatusLabel("approved"), "Approved");
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
    assert.equal(resolveControlReviewStatus({}, "ac-99"), "not_reviewed");
    assert.equal(DEFAULT_CONTROL_REVIEW_STATUS, "not_reviewed");
  });

  it("does not put reviewStatus on upsert metadata payload", () => {
    const parsed = parseUpsertControlRecordInput({
      controlId: "ac-2",
      owner: "A",
      coOwner: "",
      businessUnit: "",
      implementationStatus: "draft",
      reviewDueDate: null,
      reviewStatus: "approved",
    });
    assert.ok(parsed);
    assert.equal(
      Object.prototype.hasOwnProperty.call(parsed, "reviewStatus"),
      false,
    );
  });
});
