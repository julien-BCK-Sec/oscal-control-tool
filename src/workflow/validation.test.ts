import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseCreateWorkflowRuleInput,
  parseWorkflowAction,
  parseWorkflowCondition,
  WorkflowValidationError,
} from "@/workflow/validation";

describe("workflow rule validation", () => {
  it("parses available conditions and actions", () => {
    const condition = parseWorkflowCondition({
      type: "control_status",
      op: "eq",
      value: "draft",
    });
    assert.deepEqual(condition, {
      type: "control_status",
      op: "eq",
      value: "draft",
    });

    const action = parseWorkflowAction({
      type: "set_due_date",
      offsetDays: 7,
    });
    assert.deepEqual(action, { type: "set_due_date", offsetDays: 7 });
  });

  it("rejects unavailable priority/severity conditions and tag actions", () => {
    assert.throws(
      () =>
        parseWorkflowCondition({ type: "priority", op: "eq", value: "high" }),
      (err: unknown) =>
        err instanceof WorkflowValidationError && /Priority/.test(err.message),
    );
    assert.throws(
      () => parseWorkflowAction({ type: "add_tag", tag: "x" }),
      (err: unknown) =>
        err instanceof WorkflowValidationError && /Tags/.test(err.message),
    );
  });

  it("requires at least one action on create", () => {
    assert.throws(
      () =>
        parseCreateWorkflowRuleInput({
          organizationId: "org-1",
          name: "Rule",
          triggerType: "control_assigned",
          conditions: [],
          actions: [],
          createdByUserId: "user-1",
        }),
      WorkflowValidationError,
    );
  });

  it("parses a full create payload", () => {
    const parsed = parseCreateWorkflowRuleInput({
      organizationId: " org-1 ",
      name: " High priority notify ",
      description: null,
      triggerType: "control_assigned",
      conditions: [
        { type: "assigned_role", op: "eq", value: "owner" },
        { type: "framework", op: "eq", value: "nist-sp-800-53-rev5-moderate" },
      ],
      actions: [
        { type: "notify_user", userId: "u2" },
        { type: "change_status", implementationStatus: "in_review" },
      ],
      createdByUserId: "u1",
    });
    assert.equal(parsed.organizationId, "org-1");
    assert.equal(parsed.name, "High priority notify");
    assert.equal(parsed.enabled, true);
    assert.equal(parsed.conditions.length, 2);
    assert.equal(parsed.actions.length, 2);
  });
});
