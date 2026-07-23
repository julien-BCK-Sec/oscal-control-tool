import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ORG_ROLES,
  isOrgRole,
  permissionsForRole,
  reviewActionPermission,
  roleHasPermission,
  type Permission,
} from "./permissions";

describe("RBAC permission matrix", () => {
  it("grants the organization admin every permission", () => {
    const all: Permission[] = [
      "org.manage_members",
      "org.invite",
      "project.create",
      "project.read",
      "project.update",
      "project.delete",
      "control.edit_implementation",
      "control.edit_metadata",
      "review.submit",
      "review.start",
      "review.approve",
      "review.request_changes",
      "review.resubmit",
      "review.reopen",
      "discussion.read",
      "discussion.create",
      "discussion.reply",
      "discussion.edit_own",
      "discussion.delete_own",
      "discussion.moderate",
      "discussion.resolve",
      "assignment.read",
      "assignment.manage",
      "notification.read",
      "notification.manage_own",
      "event.diagnostics.read",
    ];
    for (const permission of all) {
      assert.equal(
        roleHasPermission("organization_admin", permission),
        true,
        `admin should have ${permission}`,
      );
    }
  });

  it("lets viewers read collaboration but never mutate", () => {
    assert.equal(roleHasPermission("viewer", "project.read"), true);
    assert.equal(roleHasPermission("viewer", "discussion.read"), true);
    assert.equal(roleHasPermission("viewer", "assignment.read"), true);
    assert.equal(roleHasPermission("viewer", "notification.read"), true);
    assert.equal(roleHasPermission("viewer", "discussion.create"), false);
    assert.equal(roleHasPermission("viewer", "discussion.reply"), false);
    assert.equal(roleHasPermission("viewer", "assignment.manage"), false);
    assert.equal(roleHasPermission("viewer", "discussion.moderate"), false);
    assert.equal(roleHasPermission("viewer", "project.update"), false);
    assert.equal(roleHasPermission("viewer", "control.edit_implementation"), false);
    assert.equal(roleHasPermission("viewer", "control.edit_metadata"), false);
    assert.equal(roleHasPermission("viewer", "review.submit"), false);
    assert.equal(roleHasPermission("viewer", "review.approve"), false);
    assert.equal(roleHasPermission("viewer", "org.invite"), false);
  });

  it("lets authors participate in discussions but not moderate or assign", () => {
    assert.equal(roleHasPermission("author", "control.edit_implementation"), true);
    assert.equal(roleHasPermission("author", "control.edit_metadata"), true);
    assert.equal(roleHasPermission("author", "review.submit"), true);
    assert.equal(roleHasPermission("author", "review.resubmit"), true);
    assert.equal(roleHasPermission("author", "discussion.create"), true);
    assert.equal(roleHasPermission("author", "discussion.reply"), true);
    assert.equal(roleHasPermission("author", "discussion.resolve"), true);
    assert.equal(roleHasPermission("author", "discussion.moderate"), false);
    assert.equal(roleHasPermission("author", "assignment.manage"), false);
    assert.equal(roleHasPermission("author", "review.approve"), false);
    assert.equal(roleHasPermission("author", "review.start"), false);
    assert.equal(roleHasPermission("author", "review.request_changes"), false);
    assert.equal(roleHasPermission("author", "project.create"), false);
    assert.equal(roleHasPermission("author", "project.delete"), false);
    assert.equal(roleHasPermission("author", "org.invite"), false);
  });

  it("lets reviewers participate in discussions but not assign work", () => {
    assert.equal(roleHasPermission("reviewer", "review.start"), true);
    assert.equal(roleHasPermission("reviewer", "review.approve"), true);
    assert.equal(roleHasPermission("reviewer", "review.request_changes"), true);
    assert.equal(roleHasPermission("reviewer", "review.reopen"), true);
    assert.equal(roleHasPermission("reviewer", "discussion.create"), true);
    assert.equal(roleHasPermission("reviewer", "discussion.reply"), true);
    assert.equal(roleHasPermission("reviewer", "discussion.resolve"), true);
    assert.equal(roleHasPermission("reviewer", "assignment.manage"), false);
    assert.equal(roleHasPermission("reviewer", "discussion.moderate"), false);
    assert.equal(roleHasPermission("reviewer", "control.edit_implementation"), false);
    assert.equal(roleHasPermission("reviewer", "control.edit_metadata"), false);
    assert.equal(roleHasPermission("reviewer", "review.submit"), false);
    assert.equal(roleHasPermission("reviewer", "project.update"), false);
  });

  it("lets project managers moderate discussions and manage assignments", () => {
    assert.equal(roleHasPermission("project_manager", "project.create"), true);
    assert.equal(roleHasPermission("project_manager", "project.delete"), true);
    assert.equal(roleHasPermission("project_manager", "review.approve"), true);
    assert.equal(roleHasPermission("project_manager", "control.edit_implementation"), true);
    assert.equal(roleHasPermission("project_manager", "discussion.moderate"), true);
    assert.equal(roleHasPermission("project_manager", "assignment.manage"), true);
    assert.equal(roleHasPermission("project_manager", "discussion.resolve"), true);
    assert.equal(roleHasPermission("project_manager", "org.manage_members"), false);
    assert.equal(roleHasPermission("project_manager", "org.invite"), false);
    assert.equal(roleHasPermission("project_manager", "event.diagnostics.read"), false);
  });

  it("fails closed for unknown or missing roles", () => {
    assert.equal(roleHasPermission(null, "project.read"), false);
    assert.equal(roleHasPermission(undefined, "project.read"), false);
    // @ts-expect-error intentionally invalid role
    assert.equal(roleHasPermission("root", "project.read"), false);
    assert.equal(isOrgRole("root"), false);
    assert.deepEqual(permissionsForRole("root" as never), []);
  });

  it("maps every review action to a distinct permission", () => {
    assert.equal(reviewActionPermission("submit_for_review"), "review.submit");
    assert.equal(reviewActionPermission("start_review"), "review.start");
    assert.equal(reviewActionPermission("approve_review"), "review.approve");
    assert.equal(reviewActionPermission("request_changes"), "review.request_changes");
    assert.equal(reviewActionPermission("resubmit_for_review"), "review.resubmit");
    assert.equal(reviewActionPermission("reopen_review"), "review.reopen");
  });

  it("declares exactly the five Milestone 1 roles", () => {
    assert.deepEqual(
      [...ORG_ROLES],
      ["organization_admin", "project_manager", "author", "reviewer", "viewer"],
    );
  });
});
