import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTROL_IMPLEMENTATION_STATUSES,
  CONTROL_REVIEW_STATUSES,
  controlImplementationStatusLabel,
  controlReviewStatusLabel,
} from "@/data/control-record";

/**
 * Badge labels must remain text-distinct (not color-only).
 * Mirrors ImplementationStatusBadge / ReviewStatusBadge display strings.
 */
describe("control list badge labels", () => {
  it("renders distinct implementation status labels", () => {
    const labels = CONTROL_IMPLEMENTATION_STATUSES.map(
      controlImplementationStatusLabel,
    );
    assert.deepEqual(labels, [
      "Draft",
      "In Review",
      "Approved",
      "Implemented",
      "Deprecated",
    ]);
    assert.equal(new Set(labels).size, labels.length);
  });

  it("renders distinct review status labels", () => {
    const labels = CONTROL_REVIEW_STATUSES.map(controlReviewStatusLabel);
    assert.deepEqual(labels, [
      "Not Reviewed",
      "Ready for Review",
      "Under Review",
      "Changes Requested",
      "Approved",
    ]);
    assert.equal(new Set(labels).size, labels.length);
  });
});
