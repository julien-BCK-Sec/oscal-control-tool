import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWorkflowTriggerType,
  WORKFLOW_ACTION_TYPES,
  WORKFLOW_CONDITION_TYPES,
  WORKFLOW_TRIGGER_TYPES,
} from "./types";

describe("workflow type catalogs", () => {
  it("exposes the approved trigger catalog", () => {
    assert.deepEqual([...WORKFLOW_TRIGGER_TYPES], [
      "control_created",
      "control_updated",
      "control_assigned",
      "assignment_completed",
      "discussion_created",
      "discussion_resolved",
    ]);
    assert.equal(isWorkflowTriggerType("control_assigned"), true);
    assert.equal(isWorkflowTriggerType("ControlAssigned"), false);
  });

  it("includes unavailable condition and action extension points in catalogs", () => {
    assert.ok(WORKFLOW_CONDITION_TYPES.includes("severity"));
    assert.ok(WORKFLOW_CONDITION_TYPES.includes("priority"));
    assert.ok(WORKFLOW_ACTION_TYPES.includes("add_tag"));
    assert.ok(WORKFLOW_ACTION_TYPES.includes("remove_tag"));
  });
});
