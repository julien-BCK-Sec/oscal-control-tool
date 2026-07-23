import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOMAIN_EVENT_TYPES,
  isDomainEventType,
} from "./catalog";
import {
  assignmentCompletedEvent,
  assignmentCreatedEvent,
  controlAssignedEvent,
  controlCreatedEvent,
  controlUpdatedEvent,
  discussionCreatedEvent,
  discussionResolvedEvent,
  discussionUpdatedEvent,
  evidenceArchivedEvent,
  evidenceCreatedEvent,
  evidenceLinkedEvent,
  evidenceUnlinkedEvent,
  evidenceUpdatedEvent,
  notificationCreatedEvent,
  projectCreatedEvent,
  projectUpdatedEvent,
} from "./factories";

describe("initial domain event catalog", () => {
  it("lists the milestone AggregateAction event types", () => {
    assert.deepEqual([...DOMAIN_EVENT_TYPES], [
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
    ]);
    assert.equal(isDomainEventType("DiscussionCreated"), true);
    assert.equal(isDomainEventType("discussion_created"), false);
  });

  it("builds immutable DTO payloads for each initial event", () => {
    const base = {
      organizationId: "org-1",
      actorId: "user-1",
      correlationId: "corr-1",
    };

    const events = [
      projectCreatedEvent({
        ...base,
        projectId: "p1",
        name: "Demo",
        frameworkId: "nist-moderate",
      }),
      projectUpdatedEvent({
        ...base,
        projectId: "p1",
        name: "Demo",
        revision: 2,
      }),
      controlCreatedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        controlRecordId: "cr-1",
      }),
      controlUpdatedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        controlRecordId: "cr-1",
      }),
      controlAssignedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        assignmentId: "a1",
        assigneeUserId: "u2",
        assignmentRole: "owner",
      }),
      discussionCreatedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        commentId: "c1",
        parentCommentId: null,
        mentionedUserIds: ["u2"],
      }),
      discussionUpdatedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        commentId: "c1",
        mentionedUserIds: [],
      }),
      discussionResolvedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        commentId: "c1",
        resolved: true,
      }),
      assignmentCreatedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        assignmentId: "a1",
        assigneeUserId: "u2",
        assignmentRole: "reviewer",
      }),
      assignmentCompletedEvent({
        ...base,
        projectId: "p1",
        controlId: "ac-1",
        assignmentId: "a1",
        assigneeUserId: "u2",
        assignmentRole: "reviewer",
      }),
      notificationCreatedEvent({
        ...base,
        notificationId: "n1",
        recipientUserId: "u2",
        notificationEventType: "assignment_created",
        relatedObjectType: "assignment",
        relatedObjectId: "a1:assignment_created",
        projectId: "p1",
        controlId: "ac-1",
      }),
      evidenceCreatedEvent({
        ...base,
        projectId: "p1",
        evidenceId: "e1",
        title: "Policy PDF",
        status: "draft",
        controlIds: ["ac-1"],
      }),
      evidenceUpdatedEvent({
        ...base,
        projectId: "p1",
        evidenceId: "e1",
        title: "Policy PDF",
        status: "active",
      }),
      evidenceArchivedEvent({
        ...base,
        projectId: "p1",
        evidenceId: "e1",
        title: "Policy PDF",
      }),
      evidenceLinkedEvent({
        ...base,
        projectId: "p1",
        evidenceId: "e1",
        controlId: "ac-2",
        title: "Policy PDF",
      }),
      evidenceUnlinkedEvent({
        ...base,
        projectId: "p1",
        evidenceId: "e1",
        controlId: "ac-2",
        title: "Policy PDF",
      }),
    ];

    assert.equal(events.length, DOMAIN_EVENT_TYPES.length);
    for (const event of events) {
      assert.ok(isDomainEventType(event.eventType));
      assert.equal(event.metadata.organizationId, "org-1");
      assert.ok(Object.isFrozen(event.payload));
      assert.equal(event.eventType, event.metadata.eventType);
    }
  });

  it("does not expose service-like values in payloads", () => {
    const event = discussionCreatedEvent({
      organizationId: "org-1",
      actorId: "user-1",
      projectId: "p1",
      controlId: "ac-1",
      commentId: "c1",
      parentCommentId: "parent-1",
      mentionedUserIds: ["u2", "u3"],
    });

    for (const value of Object.values(event.payload)) {
      assert.equal(typeof value === "function", false);
      assert.ok(
        value === null ||
          typeof value === "string" ||
          typeof value === "boolean" ||
          typeof value === "number" ||
          Array.isArray(value),
      );
    }
  });
});
