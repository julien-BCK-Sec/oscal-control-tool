/**
 * Centralized role-based access control matrix (ADR-017, Milestone 1 WP5).
 *
 * This is the single authoritative source for what each organization role may
 * do. Server-side entry points must consult it before every organization-owned
 * read or mutation (`src/authz/authorize.ts`). UI may hide unavailable actions
 * but hiding is never authorization.
 *
 * Pure module: no database, session, or framework imports, so it is trivially
 * unit-testable and safe to import from both server and client code.
 */

import type { ControlReviewAction } from "@/data/control-review";

/** Fixed Milestone 1 roles (ADR-017). No custom roles. */
export const ORG_ROLES = [
  "organization_admin",
  "project_manager",
  "author",
  "reviewer",
  "viewer",
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

/**
 * Every distinct capability guarded server-side. Review transitions are
 * modeled per-action so authoring vs. reviewing authority stays explicit.
 */
export type Permission =
  | "org.manage_members"
  | "org.invite"
  | "project.create"
  | "project.read"
  | "project.update"
  | "project.delete"
  | "control.edit_implementation"
  | "control.edit_metadata"
  | "review.submit"
  | "review.start"
  | "review.approve"
  | "review.request_changes"
  | "review.resubmit"
  | "review.reopen"
  /** Collaboration (Milestone 02A) */
  | "discussion.read"
  | "discussion.create"
  | "discussion.reply"
  | "discussion.edit_own"
  | "discussion.delete_own"
  | "discussion.moderate"
  | "discussion.resolve"
  | "assignment.read"
  | "assignment.manage"
  | "notification.read"
  | "notification.manage_own"
  /** Domain event diagnostics (Milestone 02B) — organization admin only. */
  | "event.diagnostics.read"
  /** Workflow automation (Milestone 02C) — organization admin only. */
  | "workflow.read"
  | "workflow.manage";

/**
 * Role → permissions. Encoded as arrays for readability and frozen into sets
 * at module load for O(1) checks. Higher roles list their full permission set
 * explicitly (no inheritance magic) so the matrix is auditable at a glance.
 */
const COLLABORATION_PARTICIPANT: readonly Permission[] = [
  "discussion.read",
  "discussion.create",
  "discussion.reply",
  "discussion.edit_own",
  "discussion.delete_own",
  "discussion.resolve",
  "assignment.read",
  "notification.read",
  "notification.manage_own",
];

const COLLABORATION_MODERATOR: readonly Permission[] = [
  ...COLLABORATION_PARTICIPANT,
  "discussion.moderate",
  "assignment.manage",
];

const ROLE_PERMISSION_LISTS: Record<OrgRole, readonly Permission[]> = {
  organization_admin: [
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
    ...COLLABORATION_MODERATOR,
    "event.diagnostics.read",
    "workflow.read",
    "workflow.manage",
  ],
  project_manager: [
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
    ...COLLABORATION_MODERATOR,
  ],
  author: [
    "project.read",
    "project.update",
    "control.edit_implementation",
    "control.edit_metadata",
    "review.submit",
    "review.resubmit",
    ...COLLABORATION_PARTICIPANT,
  ],
  reviewer: [
    "project.read",
    "review.start",
    "review.approve",
    "review.request_changes",
    "review.reopen",
    ...COLLABORATION_PARTICIPANT,
  ],
  viewer: ["project.read", "discussion.read", "assignment.read", "notification.read"],
};

const ROLE_PERMISSIONS: Record<OrgRole, ReadonlySet<Permission>> = Object.freeze(
  ORG_ROLES.reduce(
    (acc, role) => {
      acc[role] = new Set(ROLE_PERMISSION_LISTS[role]);
      return acc;
    },
    {} as Record<OrgRole, Set<Permission>>,
  ),
);

/** Map each review workflow action to the permission that authorizes it. */
export const REVIEW_ACTION_PERMISSION: Record<
  ControlReviewAction,
  Permission
> = {
  submit_for_review: "review.submit",
  start_review: "review.start",
  approve_review: "review.approve",
  request_changes: "review.request_changes",
  resubmit_for_review: "review.resubmit",
  reopen_review: "review.reopen",
};

export function isOrgRole(value: unknown): value is OrgRole {
  return (
    typeof value === "string" && (ORG_ROLES as readonly string[]).includes(value)
  );
}

/** Fail-closed permission check. Unknown roles have no permissions. */
export function roleHasPermission(
  role: OrgRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role || !isOrgRole(role)) {
    return false;
  }
  return ROLE_PERMISSIONS[role].has(permission);
}

/** Permission required to perform a review transition action. */
export function reviewActionPermission(
  action: ControlReviewAction,
): Permission {
  return REVIEW_ACTION_PERMISSION[action];
}

/** Full permission list for a role (defensive copy). Empty for unknown roles. */
export function permissionsForRole(
  role: OrgRole | null | undefined,
): Permission[] {
  if (!role || !isOrgRole(role)) {
    return [];
  }
  return [...ROLE_PERMISSIONS[role]];
}
