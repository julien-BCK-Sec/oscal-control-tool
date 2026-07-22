import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AuthorizationError,
  can,
  requirePermission,
  type OrgContext,
} from "./authorize";

const admin: OrgContext = {
  userId: "user-admin",
  organizationId: "org-1",
  role: "organization_admin",
};
const viewer: OrgContext = {
  userId: "user-viewer",
  organizationId: "org-1",
  role: "viewer",
};

describe("authorize.can", () => {
  it("allows a permitted action in the actor's own organization", () => {
    assert.equal(can(admin, "org-1", "org.invite"), true);
    assert.equal(can(viewer, "org-1", "project.read"), true);
  });

  it("fails closed when the actor is missing", () => {
    assert.equal(can(null, "org-1", "project.read"), false);
    assert.equal(can(undefined, "org-1", "project.read"), false);
  });

  it("denies actions in a different organization even with a valid role", () => {
    assert.equal(can(admin, "org-2", "org.invite"), false);
    assert.equal(can(admin, "", "org.invite"), false);
  });

  it("denies permissions the role does not hold", () => {
    assert.equal(can(viewer, "org-1", "project.update"), false);
  });
});

describe("authorize.requirePermission", () => {
  it("passes for a permitted action and narrows the context type", () => {
    const ctx: OrgContext | null = admin;
    requirePermission(ctx, "org-1", "org.invite");
    // Type narrowed: accessing ctx.role must compile without a null check.
    assert.equal(ctx.role, "organization_admin");
  });

  it("throws unauthenticated when context is null", () => {
    assert.throws(
      () => requirePermission(null, "org-1", "project.read"),
      (error: unknown) =>
        error instanceof AuthorizationError && error.code === "unauthenticated",
    );
  });

  it("throws wrong-organization across tenants (no existence leak)", () => {
    assert.throws(
      () => requirePermission(admin, "org-2", "project.read"),
      (error: unknown) =>
        error instanceof AuthorizationError &&
        error.code === "wrong-organization",
    );
  });

  it("throws forbidden when the role lacks the permission", () => {
    assert.throws(
      () => requirePermission(viewer, "org-1", "project.update"),
      (error: unknown) =>
        error instanceof AuthorizationError && error.code === "forbidden",
    );
  });
});
