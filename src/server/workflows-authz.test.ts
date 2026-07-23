import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import { roleHasPermission, type OrgRole } from "@/authz/permissions";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresWorkflowRepository } from "@/persistence/postgres/workflow-repository";
import {
  createWorkflowRuleForOrg,
  deleteWorkflowRuleForOrg,
  getWorkflowRuleForOrg,
  listWorkflowExecutionsForOrg,
  listWorkflowRulesForOrg,
  setWorkflowRuleEnabledForOrg,
  updateWorkflowRuleForOrg,
} from "./authorized-workflows";

function ctx(
  organizationId: string,
  role: OrgRole,
  userId = "user-1",
): OrgContext {
  return { userId, organizationId, role };
}

afterEach(async () => {
  await closeDb();
});

describe("workflow authorization", () => {
  it("grants workflow permissions only to organization admins", () => {
    assert.equal(roleHasPermission("organization_admin", "workflow.read"), true);
    assert.equal(
      roleHasPermission("organization_admin", "workflow.manage"),
      true,
    );
    for (const role of [
      "project_manager",
      "author",
      "reviewer",
      "viewer",
    ] as const) {
      assert.equal(
        roleHasPermission(role, "workflow.read"),
        false,
        `${role} must not read workflows`,
      );
      assert.equal(
        roleHasPermission(role, "workflow.manage"),
        false,
        `${role} must not manage workflows`,
      );
    }
  });

  it("allows admins to CRUD rules and denies other roles", async () => {
    const db = await openTestDb();
    const repo = createPostgresWorkflowRepository(db);
    const admin = ctx("org-a", "organization_admin", "admin-1");

    const created = await createWorkflowRuleForOrg(repo, admin, {
      name: "Notify on assign",
      triggerType: "control_assigned",
      conditions: [],
      actions: [{ type: "notify_user", userId: "u2" }],
    });
    assert.equal(created.ok, true);
    if (!created.ok) {
      return;
    }

    const listed = await listWorkflowRulesForOrg(repo, admin);
    assert.equal(listed.length, 1);

    const updated = await updateWorkflowRuleForOrg(
      repo,
      admin,
      created.rule.id,
      { name: "Renamed" },
    );
    assert.equal(updated.ok, true);

    const toggled = await setWorkflowRuleEnabledForOrg(
      repo,
      admin,
      created.rule.id,
      false,
    );
    assert.equal(toggled.ok && toggled.rule.enabled, false);

    await assert.rejects(
      () => listWorkflowRulesForOrg(repo, ctx("org-a", "project_manager")),
      (err: unknown) =>
        err instanceof AuthorizationError && err.code === "forbidden",
    );

    await assert.rejects(
      () => getWorkflowRuleForOrg(repo, ctx("org-a", "author"), created.rule.id),
      AuthorizationError,
    );

    const deniedCreate = await createWorkflowRuleForOrg(
      repo,
      ctx("org-a", "viewer"),
      {
        name: "Nope",
        triggerType: "control_created",
        conditions: [],
        actions: [{ type: "notify_user", userId: "u2" }],
      },
    );
    assert.equal(deniedCreate.ok, false);

    const deleted = await deleteWorkflowRuleForOrg(
      repo,
      admin,
      created.rule.id,
    );
    assert.equal(deleted.ok, true);
  });

  it("keeps workflow rules and executions tenant-scoped", async () => {
    const db = await openTestDb();
    const repo = createPostgresWorkflowRepository(db);
    const adminA = ctx("org-a", "organization_admin", "a1");
    const adminB = ctx("org-b", "organization_admin", "b1");

    const created = await createWorkflowRuleForOrg(repo, adminA, {
      name: "A only",
      triggerType: "discussion_resolved",
      conditions: [],
      actions: [{ type: "notify_role", orgRole: "organization_admin" }],
    });
    assert.equal(created.ok, true);
    if (!created.ok) {
      return;
    }

    const crossGet = await getWorkflowRuleForOrg(
      repo,
      adminB,
      created.rule.id,
    );
    assert.equal(crossGet, null);

    const crossList = await listWorkflowRulesForOrg(repo, adminB);
    assert.equal(crossList.length, 0);

    await repo.recordExecution({
      organizationId: "org-a",
      workflowRuleId: created.rule.id,
      triggeringEventId: "evt-a",
      triggeringEventType: "DiscussionResolved",
      correlationId: "c1",
      projectId: null,
      controlId: null,
      status: "succeeded",
      conditionsMatched: true,
      durationMs: 5,
      errorMessage: null,
      detail: {
        triggeringEventId: "evt-a",
        triggeringEventType: "DiscussionResolved",
        correlationId: "c1",
        projectId: null,
        controlId: null,
        conditionsMatched: true,
        conditionResults: [],
        actionResults: [],
      },
      startedAt: "2026-07-22T12:00:00.000Z",
      finishedAt: "2026-07-22T12:00:00.005Z",
    });

    const execA = await listWorkflowExecutionsForOrg(repo, adminA);
    assert.equal(execA.length, 1);
    const execB = await listWorkflowExecutionsForOrg(repo, adminB);
    assert.equal(execB.length, 0);

    await assert.rejects(
      () => listWorkflowExecutionsForOrg(repo, ctx("org-a", "viewer")),
      AuthorizationError,
    );
  });
});
