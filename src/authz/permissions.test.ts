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
    ];
    for (const permission of all) {
      assert.equal(
        roleHasPermission("organization_admin", permission),
        true,
        `admin should have ${permission}`,
      );
    }
  });

  it("lets viewers read but never mutate", () => {
    assert.equal(roleHasPermission("viewer", "project.read"), true);
    assert.equal(roleHasPermission("viewer", "project.update"), false);
    assert.equal(roleHasPermission("viewer", "control.edit_implementation"), false);
    assert.equal(roleHasPermission("viewer", "control.edit_metadata"), false);
    assert.equal(roleHasPermission("viewer", "review.submit"), false);
    assert.equal(roleHasPermission("viewer", "review.approve"), false);
    assert.equal(roleHasPermission("viewer", "org.invite"), false);
  });

  it("lets authors edit and submit but never approve", () => {
    assert.equal(roleHasPermission("author", "control.edit_implementation"), true);
    assert.equal(roleHasPermission("author", "control.edit_metadata"), true);
    assert.equal(roleHasPermission("author", "review.submit"), true);
    assert.equal(roleHasPermission("author", "review.resubmit"), true);
    assert.equal(roleHasPermission("author", "review.approve"), false);
    assert.equal(roleHasPermission("author", "review.start"), false);
    assert.equal(roleHasPermission("author", "review.request_changes"), false);
    assert.equal(roleHasPermission("author", "project.create"), false);
    assert.equal(roleHasPermission("author", "project.delete"), false);
    assert.equal(roleHasPermission("author", "org.invite"), false);
  });

  it("lets reviewers run review transitions but not author narratives", () => {
    assert.equal(roleHasPermission("reviewer", "review.start"), true);
    assert.equal(roleHasPermission("reviewer", "review.approve"), true);
    assert.equal(roleHasPermission("reviewer", "review.request_changes"), true);
    assert.equal(roleHasPermission("reviewer", "review.reopen"), true);
    assert.equal(roleHasPermission("reviewer", "control.edit_implementation"), false);
    assert.equal(roleHasPermission("reviewer", "control.edit_metadata"), false);
    assert.equal(roleHasPermission("reviewer", "review.submit"), false);
    assert.equal(roleHasPermission("reviewer", "project.update"), false);
  });

  it("lets project managers manage projects but not organization membership", () => {
    assert.equal(roleHasPermission("project_manager", "project.create"), true);
    assert.equal(roleHasPermission("project_manager", "project.delete"), true);
    assert.equal(roleHasPermission("project_manager", "review.approve"), true);
    assert.equal(roleHasPermission("project_manager", "control.edit_implementation"), true);
    assert.equal(roleHasPermission("project_manager", "org.manage_members"), false);
    assert.equal(roleHasPermission("project_manager", "org.invite"), false);
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
