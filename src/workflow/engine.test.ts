import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { controlAssignedEvent } from "@/domain/events";
import {
  createWorkflowEngine,
  createWorkflowRegistries,
  isWorkflowCascadeSuppressed,
  runWithWorkflowCascadeGuard,
  type WorkflowEvaluationContext,
  type WorkflowRule,
} from "./index";

function baseContext(
  event: ReturnType<typeof controlAssignedEvent>,
  overrides: Partial<WorkflowEvaluationContext> = {},
): WorkflowEvaluationContext {
  return {
    organizationId: event.metadata.organizationId,
    event,
    projectId: event.payload.projectId,
    controlId: event.payload.controlId,
    frameworkId: "nist-sp-800-53-rev5-moderate",
    controlFamily: "Access Control",
    implementationStatus: "draft",
    activeAssignments: [
      {
        assigneeUserId: event.payload.assigneeUserId,
        assignmentRole: event.payload.assignmentRole,
      },
    ],
    ...overrides,
  };
}

function assignedEvent() {
  return controlAssignedEvent({
    organizationId: "org-1",
    actorId: "actor-1",
    projectId: "proj-1",
    controlId: "ac-2",
    assignmentId: "asg-1",
    assigneeUserId: "user-9",
    assignmentRole: "owner",
  });
}

function rule(partial: Partial<WorkflowRule> & Pick<WorkflowRule, "id">): WorkflowRule {
  return {
    organizationId: "org-1",
    name: "Test rule",
    description: null,
    enabled: true,
    triggerType: "control_assigned",
    conditions: [],
    actions: [{ type: "notify_user", userId: "user-2" }],
    ...partial,
  };
}

describe("workflow registries", () => {
  it("maps triggers to domain event types without hard-coding in the engine", () => {
    const registries = createWorkflowRegistries();
    const event = assignedEvent();
    assert.equal(
      registries.triggers.resolveTriggerType(event),
      "control_assigned",
    );
    assert.ok(registries.triggers.allEventTypes().includes("ControlAssigned"));
    assert.equal(registries.triggers.list().length, 6);
  });

  it("registers severity and priority as unavailable extension points", async () => {
    const registries = createWorkflowRegistries();
    const severity = registries.conditions.get("severity");
    const priority = registries.conditions.get("priority");
    assert.equal(severity?.available, false);
    assert.equal(priority?.available, false);

    const event = assignedEvent();
    const ctx = baseContext(event);
    const severityResult = await registries.conditions.evaluate(ctx, {
      type: "severity",
      op: "eq",
      value: "high",
    });
    assert.equal(severityResult.status, "unavailable");
    assert.equal(severityResult.matched, false);
  });

  it("registers tag actions as unavailable extension points", async () => {
    const registries = createWorkflowRegistries();
    assert.equal(registries.actions.get("add_tag")?.available, false);
    assert.equal(registries.actions.get("remove_tag")?.available, false);

    const event = assignedEvent();
    const result = await registries.actions.execute(
      {
        evaluation: baseContext(event),
        ruleId: "r1",
        ruleName: "n",
      },
      { type: "add_tag", tag: "urgent" },
    );
    assert.equal(result.status, "unavailable");
  });

  it("evaluates available conditions with AND semantics via registry", async () => {
    const registries = createWorkflowRegistries();
    const event = assignedEvent();
    const ctx = baseContext(event);

    const okStatus = await registries.conditions.evaluate(ctx, {
      type: "control_status",
      op: "eq",
      value: "draft",
    });
    assert.equal(okStatus.matched, true);

    const badUser = await registries.conditions.evaluate(ctx, {
      type: "assigned_user",
      op: "eq",
      value: "other-user",
    });
    assert.equal(badUser.matched, false);

    const role = await registries.conditions.evaluate(ctx, {
      type: "assigned_role",
      op: "eq",
      value: "owner",
    });
    assert.equal(role.matched, true);

    const family = await registries.conditions.evaluate(ctx, {
      type: "control_category",
      op: "eq",
      value: "Access Control",
    });
    assert.equal(family.matched, true);

    const framework = await registries.conditions.evaluate(ctx, {
      type: "framework",
      op: "eq",
      value: "nist-sp-800-53-rev5-moderate",
    });
    assert.equal(framework.matched, true);
  });
});

describe("workflow cascade guard", () => {
  it("reports suppression only inside the guard", async () => {
    assert.equal(isWorkflowCascadeSuppressed(), false);
    await runWithWorkflowCascadeGuard(async () => {
      assert.equal(isWorkflowCascadeSuppressed(), true);
      await runWithWorkflowCascadeGuard(async () => {
        assert.equal(isWorkflowCascadeSuppressed(), true);
      });
      assert.equal(isWorkflowCascadeSuppressed(), true);
    });
    assert.equal(isWorkflowCascadeSuppressed(), false);
  });
});

describe("workflow engine", () => {
  it("runs matching enabled rules and records diagnostics detail", async () => {
    const executed: string[] = [];
    const registries = createWorkflowRegistries({
      actionExecutors: {
        async notify_user(_ctx, config) {
          executed.push(config.userId);
          return {
            type: "notify_user",
            status: "executed",
            errorMessage: null,
          };
        },
      },
    });
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const results = await engine.handleEvent(
      event,
      [
        rule({
          id: "r1",
          conditions: [
            { type: "control_status", op: "eq", value: "draft" },
            { type: "assigned_role", op: "eq", value: "owner" },
          ],
          actions: [{ type: "notify_user", userId: "notify-me" }],
        }),
      ],
      baseContext(event),
    );

    assert.equal(results.length, 1);
    assert.equal(results[0]?.status, "succeeded");
    assert.equal(results[0]?.detail.conditionsMatched, true);
    assert.equal(results[0]?.detail.conditionResults.length, 2);
    assert.equal(results[0]?.detail.actionResults[0]?.status, "executed");
    assert.deepEqual(executed, ["notify-me"]);
    assert.ok(results[0]!.durationMs >= 0);
  });

  it("skips disabled rules and ignores non-matching triggers", async () => {
    const registries = createWorkflowRegistries();
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const results = await engine.handleEvent(
      event,
      [
        rule({ id: "disabled", enabled: false }),
        rule({
          id: "wrong-trigger",
          triggerType: "discussion_created",
        }),
        rule({
          id: "other-org",
          organizationId: "org-other",
        }),
      ],
      baseContext(event),
    );
    assert.equal(results.length, 0);
  });

  it("skips actions when conditions do not match", async () => {
    let actions = 0;
    const registries = createWorkflowRegistries({
      actionExecutors: {
        async notify_user() {
          actions += 1;
          return {
            type: "notify_user",
            status: "executed",
            errorMessage: null,
          };
        },
      },
    });
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const results = await engine.handleEvent(
      event,
      [
        rule({
          id: "r1",
          conditions: [
            { type: "control_status", op: "eq", value: "implemented" },
          ],
        }),
      ],
      baseContext(event),
    );
    assert.equal(results[0]?.status, "skipped");
    assert.equal(results[0]?.detail.conditionsMatched, false);
    assert.equal(actions, 0);
  });

  it("fails when an unavailable condition is present", async () => {
    const registries = createWorkflowRegistries();
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const results = await engine.handleEvent(
      event,
      [
        rule({
          id: "r1",
          conditions: [{ type: "priority", op: "eq", value: "high" }],
        }),
      ],
      baseContext(event),
    );
    assert.equal(results[0]?.status, "failed");
    assert.match(results[0]?.errorMessage ?? "", /Priority/);
  });

  it("continues other rules when one action fails", async () => {
    const registries = createWorkflowRegistries({
      actionExecutors: {
        async notify_user(_ctx, config) {
          if (config.userId === "boom") {
            return {
              type: "notify_user",
              status: "failed",
              errorMessage: "notify failed",
            };
          }
          return {
            type: "notify_user",
            status: "executed",
            errorMessage: null,
          };
        },
      },
    });
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const results = await engine.handleEvent(
      event,
      [
        rule({
          id: "r-fail",
          actions: [{ type: "notify_user", userId: "boom" }],
        }),
        rule({
          id: "r-ok",
          actions: [{ type: "notify_user", userId: "ok" }],
        }),
      ],
      baseContext(event),
    );
    assert.equal(results.find((r) => r.ruleId === "r-fail")?.status, "failed");
    assert.equal(results.find((r) => r.ruleId === "r-ok")?.status, "succeeded");
  });

  it("does not re-enter the engine while cascade suppression is active", async () => {
    const registries = createWorkflowRegistries();
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const nested = rule({ id: "nested" });

    let nestedRuns = 0;
    const outerRegistries = createWorkflowRegistries({
      actionExecutors: {
        async notify_user() {
          nestedRuns += 1;
          const inner = await engine.handleEvent(
            event,
            [nested],
            baseContext(event),
          );
          assert.equal(inner.length, 0);
          return {
            type: "notify_user",
            status: "executed",
            errorMessage: null,
          };
        },
      },
    });
    const outerEngine = createWorkflowEngine({ registries: outerRegistries });
    const results = await outerEngine.handleEvent(
      event,
      [rule({ id: "outer" })],
      baseContext(event),
    );
    assert.equal(results[0]?.status, "succeeded");
    assert.equal(nestedRuns, 1);
  });

  it("prevents duplicate execution for the same event and rule", async () => {
    const registries = createWorkflowRegistries();
    const engine = createWorkflowEngine({ registries });
    const event = assignedEvent();
    const rules = [rule({ id: "r1" })];
    const first = await engine.handleEvent(event, rules, baseContext(event));
    const second = await engine.handleEvent(event, rules, baseContext(event));
    assert.equal(first[0]?.status, "succeeded");
    assert.equal(second[0]?.status, "duplicate");
  });

  it("exposes subscribed event types from the trigger registry", () => {
    const engine = createWorkflowEngine({
      registries: createWorkflowRegistries(),
    });
    const types = engine.subscribedEventTypes();
    assert.ok(types.includes("ControlCreated"));
    assert.ok(types.includes("DiscussionResolved"));
    assert.ok(types.includes("AssignmentCompleted"));
  });
});
