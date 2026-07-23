/**
 * Initial domain event catalog (Milestone 02B WP4).
 *
 * Event type names use `<Aggregate><Action>` (for example `ControlAssigned`).
 * Payloads are immutable plain DTOs — never ORM entities or services.
 */

import type { AssignmentRole } from "@/data/collaboration";
import type { DomainEvent } from "./types";

export const DOMAIN_EVENT_TYPES = [
  "ProjectCreated",
  "ProjectUpdated",
  "ControlCreated",
  "ControlUpdated",
  "ControlAssigned",
  "DiscussionCreated",
  "DiscussionUpdated",
  "DiscussionResolved",
  "AssignmentCreated",
  "AssignmentCompleted",
  "NotificationCreated",
  "EvidenceCreated",
  "EvidenceUpdated",
  "EvidenceArchived",
  "EvidenceLinked",
  "EvidenceUnlinked",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export function isDomainEventType(value: unknown): value is DomainEventType {
  return (
    typeof value === "string" &&
    (DOMAIN_EVENT_TYPES as readonly string[]).includes(value)
  );
}

export type ProjectCreatedPayload = {
  readonly projectId: string;
  readonly name: string;
  readonly frameworkId: string;
};

export type ProjectUpdatedPayload = {
  readonly projectId: string;
  readonly name: string;
  readonly revision: number;
};

export type ControlCreatedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly controlRecordId: string;
};

export type ControlUpdatedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly controlRecordId: string;
};

export type ControlAssignedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly assignmentId: string;
  readonly assigneeUserId: string;
  readonly assignmentRole: AssignmentRole;
};

export type DiscussionCreatedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly commentId: string;
  readonly parentCommentId: string | null;
  readonly mentionedUserIds: readonly string[];
};

export type DiscussionUpdatedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly commentId: string;
  readonly mentionedUserIds: readonly string[];
};

export type DiscussionResolvedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly commentId: string;
  readonly resolved: boolean;
};

export type AssignmentCreatedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly assignmentId: string;
  readonly assigneeUserId: string;
  readonly assignmentRole: AssignmentRole;
};

export type AssignmentCompletedPayload = {
  readonly projectId: string;
  readonly controlId: string;
  readonly assignmentId: string;
  readonly assigneeUserId: string;
  readonly assignmentRole: AssignmentRole;
};

export type NotificationCreatedPayload = {
  readonly notificationId: string;
  readonly recipientUserId: string;
  readonly notificationEventType: string;
  readonly relatedObjectType: string;
  readonly relatedObjectId: string;
  readonly projectId: string | null;
  readonly controlId: string | null;
};

export type EvidenceCreatedPayload = {
  readonly projectId: string;
  readonly evidenceId: string;
  readonly title: string;
  readonly status: string;
  readonly controlIds: readonly string[];
};

export type EvidenceUpdatedPayload = {
  readonly projectId: string;
  readonly evidenceId: string;
  readonly title: string;
  readonly status: string;
};

export type EvidenceArchivedPayload = {
  readonly projectId: string;
  readonly evidenceId: string;
  readonly title: string;
};

export type EvidenceLinkedPayload = {
  readonly projectId: string;
  readonly evidenceId: string;
  readonly controlId: string;
  readonly title: string;
};

export type EvidenceUnlinkedPayload = {
  readonly projectId: string;
  readonly evidenceId: string;
  readonly controlId: string;
  readonly title: string;
};

export type ProjectCreatedEvent = DomainEvent<
  "ProjectCreated",
  ProjectCreatedPayload
>;
export type ProjectUpdatedEvent = DomainEvent<
  "ProjectUpdated",
  ProjectUpdatedPayload
>;
export type ControlCreatedEvent = DomainEvent<
  "ControlCreated",
  ControlCreatedPayload
>;
export type ControlUpdatedEvent = DomainEvent<
  "ControlUpdated",
  ControlUpdatedPayload
>;
export type ControlAssignedEvent = DomainEvent<
  "ControlAssigned",
  ControlAssignedPayload
>;
export type DiscussionCreatedEvent = DomainEvent<
  "DiscussionCreated",
  DiscussionCreatedPayload
>;
export type DiscussionUpdatedEvent = DomainEvent<
  "DiscussionUpdated",
  DiscussionUpdatedPayload
>;
export type DiscussionResolvedEvent = DomainEvent<
  "DiscussionResolved",
  DiscussionResolvedPayload
>;
export type AssignmentCreatedEvent = DomainEvent<
  "AssignmentCreated",
  AssignmentCreatedPayload
>;
export type AssignmentCompletedEvent = DomainEvent<
  "AssignmentCompleted",
  AssignmentCompletedPayload
>;
export type NotificationCreatedEvent = DomainEvent<
  "NotificationCreated",
  NotificationCreatedPayload
>;
export type EvidenceCreatedEvent = DomainEvent<
  "EvidenceCreated",
  EvidenceCreatedPayload
>;
export type EvidenceUpdatedEvent = DomainEvent<
  "EvidenceUpdated",
  EvidenceUpdatedPayload
>;
export type EvidenceArchivedEvent = DomainEvent<
  "EvidenceArchived",
  EvidenceArchivedPayload
>;
export type EvidenceLinkedEvent = DomainEvent<
  "EvidenceLinked",
  EvidenceLinkedPayload
>;
export type EvidenceUnlinkedEvent = DomainEvent<
  "EvidenceUnlinked",
  EvidenceUnlinkedPayload
>;

export type InitialDomainEvent =
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | ControlCreatedEvent
  | ControlUpdatedEvent
  | ControlAssignedEvent
  | DiscussionCreatedEvent
  | DiscussionUpdatedEvent
  | DiscussionResolvedEvent
  | AssignmentCreatedEvent
  | AssignmentCompletedEvent
  | NotificationCreatedEvent
  | EvidenceCreatedEvent
  | EvidenceUpdatedEvent
  | EvidenceArchivedEvent
  | EvidenceLinkedEvent
  | EvidenceUnlinkedEvent;
