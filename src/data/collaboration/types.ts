/**
 * Collaboration domain types (Milestone 02A).
 *
 * Comments, assignments, and notifications are operational metadata.
 * They are never stored in OSCAL documents or project_json.
 * Collaboration targets are Controls only (approved decision).
 */

/** Soft-deleted comments remain queryable for audit; body may be redacted in UI. */
export type Comment = {
  id: string;
  organizationId: string;
  projectId: string;
  controlId: string;
  parentCommentId: string | null;
  authorId: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateCommentInput = {
  organizationId: string;
  projectId: string;
  controlId: string;
  parentCommentId?: string | null;
  authorId: string;
  body: string;
};

export type UpdateCommentInput = {
  body: string;
};

/** One primary assignee per assignment record (approved decision). */
export const ASSIGNMENT_ROLES = ["owner", "reviewer"] as const;
export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number];

export type Assignment = {
  id: string;
  organizationId: string;
  projectId: string;
  controlId: string;
  assigneeUserId: string;
  assignmentRole: AssignmentRole;
  assignedByUserId: string;
  assignedAt: string;
  completedAt: string | null;
};

export type CreateAssignmentInput = {
  organizationId: string;
  projectId: string;
  controlId: string;
  assigneeUserId: string;
  assignmentRole: AssignmentRole;
  assignedByUserId: string;
};

export const NOTIFICATION_EVENT_TYPES = [
  "comment_mention",
  "comment_reply",
  "discussion_resolved",
  "assignment_created",
  "assignment_reassigned",
  "assignment_completed",
  "assignment_removed",
  "workflow_triggered",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const NOTIFICATION_RELATED_OBJECT_TYPES = [
  "comment",
  "assignment",
  "workflow_rule",
] as const;

export type NotificationRelatedObjectType =
  (typeof NOTIFICATION_RELATED_OBJECT_TYPES)[number];

/**
 * In-app notifications. Retained indefinitely unless explicitly deleted
 * (approved decision). Email delivery is out of scope.
 */
export type Notification = {
  id: string;
  organizationId: string;
  recipientUserId: string;
  actorUserId: string | null;
  eventType: NotificationEventType;
  relatedObjectType: NotificationRelatedObjectType;
  relatedObjectId: string;
  projectId: string | null;
  controlId: string | null;
  /** Short human-readable summary for the notification center. */
  summary: string;
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type CreateNotificationInput = {
  organizationId: string;
  recipientUserId: string;
  actorUserId?: string | null;
  eventType: NotificationEventType;
  relatedObjectType: NotificationRelatedObjectType;
  relatedObjectId: string;
  projectId?: string | null;
  controlId?: string | null;
  summary: string;
};

/** Mention of an organization member inside a comment body. */
export type CommentMention = {
  id: string;
  commentId: string;
  mentionedUserId: string;
  createdAt: string;
};

export function isAssignmentRole(value: unknown): value is AssignmentRole {
  return (
    typeof value === "string" &&
    (ASSIGNMENT_ROLES as readonly string[]).includes(value)
  );
}

export function isNotificationEventType(
  value: unknown,
): value is NotificationEventType {
  return (
    typeof value === "string" &&
    (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(value)
  );
}
