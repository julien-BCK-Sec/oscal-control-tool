/**
 * Fail-closed authorization checks (Milestone 1 WP5).
 *
 * `OrgContext` is the server-resolved identity + organization membership for
 * the current actor. It is derived from the authenticated Better Auth session
 * and the `member` table (see `src/authz/context.ts`); it is never trusted
 * from client input. Client-supplied organization identifiers cannot override
 * it because the role is looked up server-side for the requested organization.
 */

import {
  roleHasPermission,
  type OrgRole,
  type Permission,
} from "./permissions";

export type OrgContext = {
  userId: string;
  organizationId: string;
  role: OrgRole;
};

export class AuthorizationError extends Error {
  readonly code:
    | "unauthenticated"
    | "wrong-organization"
    | "forbidden";

  constructor(
    code: "unauthenticated" | "wrong-organization" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

/**
 * Non-throwing check: is `ctx` allowed to perform `permission` in
 * `organizationId`? Fails closed on missing context or cross-organization
 * access.
 */
export function can(
  ctx: OrgContext | null | undefined,
  organizationId: string,
  permission: Permission,
): boolean {
  if (!ctx) {
    return false;
  }
  if (!organizationId || ctx.organizationId !== organizationId) {
    return false;
  }
  return roleHasPermission(ctx.role, permission);
}

/**
 * Throwing check for server-side entry points. Throws `AuthorizationError`
 * (never leaks whether the resource exists) when the actor is unauthenticated,
 * is acting outside its organization, or lacks the permission.
 */
export function requirePermission(
  ctx: OrgContext | null | undefined,
  organizationId: string,
  permission: Permission,
): asserts ctx is OrgContext {
  if (!ctx) {
    throw new AuthorizationError(
      "unauthenticated",
      "Authentication is required.",
    );
  }
  if (!organizationId || ctx.organizationId !== organizationId) {
    throw new AuthorizationError(
      "wrong-organization",
      "Resource is outside the current organization context.",
    );
  }
  if (!roleHasPermission(ctx.role, permission)) {
    throw new AuthorizationError(
      "forbidden",
      `Role "${ctx.role}" is not permitted to ${permission}.`,
    );
  }
}
