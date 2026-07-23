import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresWorkflowRepository } from "@/persistence/postgres/workflow-repository";
import { WorkflowValidationError } from "@/workflow/validation";

afterEach(async () => {
  await closeDb();
});

describe("WorkflowRepository", () => {
  it("creates, lists, updates, enables, and deletes org-scoped rules", async () => {
    const db = await openTestDb();
    const workflows = createPostgresWorkflowRepository(db);

    const created = await workflows.createRule({
      organizationId: "org-a",
      name: "Notify on assign",
      triggerType: "control_assigned",
      conditions: [{ type: "control_status", op: "eq", value: "draft" }],
      actions: [{ type: "notify_user", userId: "user-2" }],
      createdByUserId: "admin-1",
    });
    assert.equal(created.organizationId, "org-a");
    assert.equal(created.triggerType, "control_assigned");
    assert.equal(created.conditions.length, 1);
    assert.equal(created.actions[0]?.type, "notify_user");

    const listed = await workflows.listRules("org-a");
    assert.equal(listed.length, 1);

    const otherOrg = await workflows.listRules("org-b");
    assert.equal(otherOrg.length, 0);

    const updated = await workflows.updateRule("org-a", created.id, {
      name: "Notify owners",
      conditions: [{ type: "assigned_role", op: "eq", value: "owner" }],
    });
    assert.equal(updated?.name, "Notify owners");
    assert.equal(updated?.conditions[0]?.type, "assigned_role");

    const disabled = await workflows.setEnabled("org-a", created.id, false);
    assert.equal(disabled?.enabled, false);

    const enabledByTrigger = await workflows.listEnabledRulesByTrigger(
      "org-a",
      "control_assigned",
    );
    assert.equal(enabledByTrigger.length, 0);

    const deleted = await workflows.deleteRule("org-a", created.id);
    assert.equal(deleted, true);
    assert.equal(await workflows.getRule("org-a", created.id), null);
  });

  it("rejects unavailable catalog entries on create", async () => {
    const db = await openTestDb();
    const workflows = createPostgresWorkflowRepository(db);
    await assert.rejects(
      () =>
        workflows.createRule({
          organizationId: "org-a",
          name: "Bad",
          triggerType: "control_assigned",
          conditions: [{ type: "severity", op: "eq", value: "high" }],
          actions: [{ type: "notify_user", userId: "u1" }],
          createdByUserId: "admin-1",
        }),
      WorkflowValidationError,
    );
  });

  it("records execution history and enforces event/rule uniqueness", async () => {
    const db = await openTestDb();
    const workflows = createPostgresWorkflowRepository(db);
    const rule = await workflows.createRule({
      organizationId: "org-a",
      name: "Rule",
      triggerType: "discussion_created",
      conditions: [],
      actions: [{ type: "notify_role", orgRole: "organization_admin" }],
      createdByUserId: "admin-1",
    });

    const detail = {
      triggeringEventId: "evt-1",
      triggeringEventType: "DiscussionCreated",
      correlationId: "corr-1",
      projectId: "p1",
      controlId: "ac-2",
      conditionsMatched: true,
      conditionResults: [],
      actionResults: [
        {
          type: "notify_role" as const,
          status: "executed" as const,
          errorMessage: null,
        },
      ],
    };

    const first = await workflows.recordExecution({
      organizationId: "org-a",
      workflowRuleId: rule.id,
      triggeringEventId: "evt-1",
      triggeringEventType: "DiscussionCreated",
      correlationId: "corr-1",
      projectId: "p1",
      controlId: "ac-2",
      status: "succeeded",
      conditionsMatched: true,
      durationMs: 12,
      errorMessage: null,
      detail,
      startedAt: "2026-07-22T12:00:00.000Z",
      finishedAt: "2026-07-22T12:00:00.012Z",
    });
    assert.ok(first);
    assert.equal(first.status, "succeeded");
    assert.equal(first.detail.actionResults.length, 1);
    assert.equal(await workflows.hasExecution("evt-1", rule.id), true);

    const duplicate = await workflows.recordExecution({
      organizationId: "org-a",
      workflowRuleId: rule.id,
      triggeringEventId: "evt-1",
      triggeringEventType: "DiscussionCreated",
      correlationId: "corr-1",
      projectId: "p1",
      controlId: "ac-2",
      status: "succeeded",
      conditionsMatched: true,
      durationMs: 1,
      errorMessage: null,
      detail,
      startedAt: "2026-07-22T12:01:00.000Z",
      finishedAt: "2026-07-22T12:01:00.001Z",
    });
    assert.equal(duplicate, null);

    const listed = await workflows.listExecutions("org-a", {
      workflowRuleId: rule.id,
    });
    assert.equal(listed.length, 1);
    assert.equal(await workflows.listExecutions("org-b").then((r) => r.length), 0);
  });
});
