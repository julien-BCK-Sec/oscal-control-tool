import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTROL_REVIEW_TRANSITIONS,
  getAvailableReviewActions,
  isControlReviewAction,
  isLegalReviewStatusTransition,
  resolveReviewTransition,
} from "@/data/control-review";
import type { ControlReviewStatus } from "@/data/control-record";

describe("control review state machine", () => {
  it("exposes every legal transition exactly once", () => {
    const expected: Array<{
      from: ControlReviewStatus;
      to: ControlReviewStatus;
      action: string;
      activityType: string;
    }> = [
      {
        from: "not_reviewed",
        to: "ready_for_review",
        action: "submit_for_review",
        activityType: "review_requested",
      },
      {
        from: "ready_for_review",
        to: "under_review",
        action: "start_review",
        activityType: "review_started",
      },
      {
        from: "under_review",
        to: "approved",
        action: "approve_review",
        activityType: "review_approved",
      },
      {
        from: "under_review",
        to: "changes_requested",
        action: "request_changes",
        activityType: "changes_requested",
      },
      {
        from: "changes_requested",
        to: "ready_for_review",
        action: "resubmit_for_review",
        activityType: "review_resubmitted",
      },
      {
        from: "approved",
        to: "ready_for_review",
        action: "reopen_review",
        activityType: "review_reopened",
      },
    ];

    assert.equal(CONTROL_REVIEW_TRANSITIONS.length, expected.length);
    for (const row of expected) {
      const found = resolveReviewTransition(
        row.from,
        row.action as Parameters<typeof resolveReviewTransition>[1],
      );
      assert.ok(found, `missing transition ${row.action}`);
      assert.equal(found?.to, row.to);
      assert.equal(found?.activityType, row.activityType);
      assert.equal(isLegalReviewStatusTransition(row.from, row.to), true);
    }
  });

  it("rejects illegal direct transitions", () => {
    assert.equal(
      isLegalReviewStatusTransition("not_reviewed", "approved"),
      false,
    );
    assert.equal(
      isLegalReviewStatusTransition("not_reviewed", "under_review"),
      false,
    );
    assert.equal(
      isLegalReviewStatusTransition("approved", "under_review"),
      false,
    );
    assert.equal(
      resolveReviewTransition("not_reviewed", "approve_review"),
      null,
    );
    assert.equal(resolveReviewTransition("under_review", "start_review"), null);
  });

  it("returns only valid actions for each status", () => {
    assert.deepEqual(getAvailableReviewActions("not_reviewed"), [
      "submit_for_review",
    ]);
    assert.deepEqual(getAvailableReviewActions("ready_for_review"), [
      "start_review",
    ]);
    assert.deepEqual(getAvailableReviewActions("under_review"), [
      "approve_review",
      "request_changes",
    ]);
    assert.deepEqual(getAvailableReviewActions("changes_requested"), [
      "resubmit_for_review",
    ]);
    assert.deepEqual(getAvailableReviewActions("approved"), ["reopen_review"]);
  });

  it("validates action names", () => {
    assert.equal(isControlReviewAction("submit_for_review"), true);
    assert.equal(isControlReviewAction("approve"), false);
    assert.equal(isControlReviewAction("ready_for_review"), false);
  });
});
