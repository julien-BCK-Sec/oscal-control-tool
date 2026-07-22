import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatControlActivitySummary,
  formatControlActivityTimestamp,
  type ControlActivity,
} from "@/data/control-activity";

function activity(
  patch: Partial<ControlActivity> &
    Pick<ControlActivity, "activityType">,
): ControlActivity {
  return {
    id: "a1",
    controlRecordId: "cr1",
    actorId: null,
    actorDisplayName: "Julien",
    fieldName: null,
    previousValue: null,
    newValue: null,
    metadataJson: null,
    createdAt: "2026-07-22T12:00:00.000Z",
    ...patch,
  };
}

describe("control activity presentation", () => {
  it("formats implementation status and owner summaries", () => {
    assert.equal(
      formatControlActivitySummary(
        activity({
          activityType: "implementation_status_changed",
          fieldName: "implementationStatus",
          previousValue: "draft",
          newValue: "in_review",
        }),
      ),
      "Julien changed implementation status from Draft to In Review",
    );
    assert.equal(
      formatControlActivitySummary(
        activity({
          activityType: "owner_changed",
          fieldName: "owner",
          previousValue: null,
          newValue: "Blake Hodder",
        }),
      ),
      "Julien assigned owner to Blake Hodder",
    );
    assert.equal(
      formatControlActivitySummary(
        activity({
          activityType: "control_record_created",
          actorDisplayName: "System",
        }),
      ),
      "System created the control record",
    );
  });

  it("formats relative timestamps", () => {
    const now = new Date("2026-07-22T12:05:00.000Z");
    assert.equal(
      formatControlActivityTimestamp("2026-07-22T12:03:00.000Z", now),
      "2 minutes ago",
    );
  });
});
