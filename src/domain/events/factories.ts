import type { AssignmentRole } from "@/data/collaboration";
import { createDomainEvent } from "./create-domain-event";
import type {
  AssignmentCompletedEvent,
  AssignmentCreatedEvent,
  ControlAssignedEvent,
  ControlCreatedEvent,
  ControlUpdatedEvent,
  DiscussionCreatedEvent,
  DiscussionResolvedEvent,
  DiscussionUpdatedEvent,
  NotificationCreatedEvent,
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
} from "./catalog";

type EventActorInput = {
  organizationId: string;
  actorId: string | null;
  correlationId?: string;
  occurredAt?: string;
};

export function projectCreatedEvent(
  input: EventActorInput & {
    projectId: string;
    name: string;
    frameworkId: string;
  },
): ProjectCreatedEvent {
  return createDomainEvent({
    eventType: "ProjectCreated",
    organizationId: input.organizationId,
    aggregateId: input.projectId,
    aggregateType: "project",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      name: input.name,
      frameworkId: input.frameworkId,
    },
  });
}

export function projectUpdatedEvent(
  input: EventActorInput & {
    projectId: string;
    name: string;
    revision: number;
  },
): ProjectUpdatedEvent {
  return createDomainEvent({
    eventType: "ProjectUpdated",
    organizationId: input.organizationId,
    aggregateId: input.projectId,
    aggregateType: "project",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      name: input.name,
      revision: input.revision,
    },
  });
}

export function controlCreatedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    controlRecordId: string;
  },
): ControlCreatedEvent {
  return createDomainEvent({
    eventType: "ControlCreated",
    organizationId: input.organizationId,
    aggregateId: input.controlRecordId,
    aggregateType: "control",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      controlRecordId: input.controlRecordId,
    },
  });
}

export function controlUpdatedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    controlRecordId: string;
  },
): ControlUpdatedEvent {
  return createDomainEvent({
    eventType: "ControlUpdated",
    organizationId: input.organizationId,
    aggregateId: input.controlRecordId,
    aggregateType: "control",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      controlRecordId: input.controlRecordId,
    },
  });
}

export function controlAssignedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    assignmentId: string;
    assigneeUserId: string;
    assignmentRole: AssignmentRole;
  },
): ControlAssignedEvent {
  return createDomainEvent({
    eventType: "ControlAssigned",
    organizationId: input.organizationId,
    aggregateId: input.controlId,
    aggregateType: "control",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      assignmentId: input.assignmentId,
      assigneeUserId: input.assigneeUserId,
      assignmentRole: input.assignmentRole,
    },
  });
}

export function discussionCreatedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    commentId: string;
    parentCommentId: string | null;
    mentionedUserIds: readonly string[];
  },
): DiscussionCreatedEvent {
  return createDomainEvent({
    eventType: "DiscussionCreated",
    organizationId: input.organizationId,
    aggregateId: input.commentId,
    aggregateType: "discussion",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      commentId: input.commentId,
      parentCommentId: input.parentCommentId,
      mentionedUserIds: [...input.mentionedUserIds],
    },
  });
}

export function discussionUpdatedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    commentId: string;
    mentionedUserIds: readonly string[];
  },
): DiscussionUpdatedEvent {
  return createDomainEvent({
    eventType: "DiscussionUpdated",
    organizationId: input.organizationId,
    aggregateId: input.commentId,
    aggregateType: "discussion",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      commentId: input.commentId,
      mentionedUserIds: [...input.mentionedUserIds],
    },
  });
}

export function discussionResolvedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    commentId: string;
    resolved: boolean;
  },
): DiscussionResolvedEvent {
  return createDomainEvent({
    eventType: "DiscussionResolved",
    organizationId: input.organizationId,
    aggregateId: input.commentId,
    aggregateType: "discussion",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      commentId: input.commentId,
      resolved: input.resolved,
    },
  });
}

export function assignmentCreatedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    assignmentId: string;
    assigneeUserId: string;
    assignmentRole: AssignmentRole;
  },
): AssignmentCreatedEvent {
  return createDomainEvent({
    eventType: "AssignmentCreated",
    organizationId: input.organizationId,
    aggregateId: input.assignmentId,
    aggregateType: "assignment",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      assignmentId: input.assignmentId,
      assigneeUserId: input.assigneeUserId,
      assignmentRole: input.assignmentRole,
    },
  });
}

export function assignmentCompletedEvent(
  input: EventActorInput & {
    projectId: string;
    controlId: string;
    assignmentId: string;
    assigneeUserId: string;
    assignmentRole: AssignmentRole;
  },
): AssignmentCompletedEvent {
  return createDomainEvent({
    eventType: "AssignmentCompleted",
    organizationId: input.organizationId,
    aggregateId: input.assignmentId,
    aggregateType: "assignment",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      projectId: input.projectId,
      controlId: input.controlId,
      assignmentId: input.assignmentId,
      assigneeUserId: input.assigneeUserId,
      assignmentRole: input.assignmentRole,
    },
  });
}

export function notificationCreatedEvent(
  input: EventActorInput & {
    notificationId: string;
    recipientUserId: string;
    notificationEventType: string;
    relatedObjectType: string;
    relatedObjectId: string;
    projectId: string | null;
    controlId: string | null;
  },
): NotificationCreatedEvent {
  return createDomainEvent({
    eventType: "NotificationCreated",
    organizationId: input.organizationId,
    aggregateId: input.notificationId,
    aggregateType: "notification",
    actorId: input.actorId,
    correlationId: input.correlationId,
    occurredAt: input.occurredAt,
    payload: {
      notificationId: input.notificationId,
      recipientUserId: input.recipientUserId,
      notificationEventType: input.notificationEventType,
      relatedObjectType: input.relatedObjectType,
      relatedObjectId: input.relatedObjectId,
      projectId: input.projectId,
      controlId: input.controlId,
    },
  });
}
