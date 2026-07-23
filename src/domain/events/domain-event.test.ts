import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDomainEvent } from "./create-domain-event";
import {
  DOMAIN_EVENT_AGGREGATE_TYPES,
  type DomainEvent,
  type DomainEventBus,
  type DomainEventHandler,
  type DomainEventPublisher,
} from "./types";

describe("domain event foundation", () => {
  it("creates an organization-scoped immutable event with metadata", () => {
    const event = createDomainEvent({
      eventType: "DiscussionCreated",
      organizationId: "org-1",
      aggregateId: "comment-1",
      aggregateType: "discussion",
      actorId: "user-1",
      correlationId: "corr-1",
      occurredAt: "2026-07-22T12:00:00.000Z",
      id: "evt-1",
      payload: {
        projectId: "proj-1",
        controlId: "ac-1",
        commentId: "comment-1",
      },
    });

    assert.equal(event.eventType, "DiscussionCreated");
    assert.equal(event.metadata.id, "evt-1");
    assert.equal(event.metadata.organizationId, "org-1");
    assert.equal(event.metadata.aggregateId, "comment-1");
    assert.equal(event.metadata.aggregateType, "discussion");
    assert.equal(event.metadata.actorId, "user-1");
    assert.equal(event.metadata.correlationId, "corr-1");
    assert.equal(event.metadata.occurredAt, "2026-07-22T12:00:00.000Z");
    assert.deepEqual(event.payload, {
      projectId: "proj-1",
      controlId: "ac-1",
      commentId: "comment-1",
    });
    assert.ok(Object.isFrozen(event));
    assert.ok(Object.isFrozen(event.metadata));
    assert.ok(Object.isFrozen(event.payload));
  });

  it("deep-freezes nested payload DTOs", () => {
    const event = createDomainEvent({
      eventType: "ControlAssigned",
      organizationId: "org-1",
      aggregateId: "assignment-1",
      aggregateType: "assignment",
      actorId: null,
      payload: {
        projectId: "proj-1",
        nested: { role: "owner" },
      },
    });

    assert.throws(() => {
      (event.payload as { projectId: string }).projectId = "other";
    }, TypeError);
    assert.throws(() => {
      (event.payload as { nested: { role: string } }).nested.role = "reviewer";
    }, TypeError);
  });

  it("assigns ids and timestamps when omitted", () => {
    const event = createDomainEvent({
      eventType: "ProjectCreated",
      organizationId: "org-1",
      aggregateId: "proj-1",
      aggregateType: "project",
      actorId: "user-1",
      payload: { name: "Demo" },
    });

    assert.match(event.metadata.id, /^[0-9a-f-]{36}$/i);
    assert.match(event.metadata.correlationId, /^[0-9a-f-]{36}$/i);
    assert.ok(Date.parse(event.metadata.occurredAt) > 0);
  });

  it("rejects missing tenant or aggregate identity", () => {
    assert.throws(
      () =>
        createDomainEvent({
          eventType: "ProjectCreated",
          organizationId: "  ",
          aggregateId: "proj-1",
          aggregateType: "project",
          actorId: null,
          payload: {},
        }),
      /organizationId/,
    );
    assert.throws(
      () =>
        createDomainEvent({
          eventType: "ProjectCreated",
          organizationId: "org-1",
          aggregateId: "",
          aggregateType: "project",
          actorId: null,
          payload: {},
        }),
      /aggregateId/,
    );
    assert.throws(
      () =>
        createDomainEvent({
          eventType: "  ",
          organizationId: "org-1",
          aggregateId: "proj-1",
          aggregateType: "project",
          actorId: null,
          payload: {},
        }),
      /eventType/,
    );
  });

  it("exposes distinct publisher, bus, and handler contracts", () => {
    const handler: DomainEventHandler = {
      handlerId: "test-handler",
      eventTypes: ["ProjectCreated"],
      handle() {},
    };

    const bus: DomainEventBus = {
      subscribe() {},
      unsubscribe() {},
      async dispatch() {},
    };

    const publisher: DomainEventPublisher = {
      async publish(event: DomainEvent) {
        await bus.dispatch(event);
      },
      async publishAll(events: readonly DomainEvent[]) {
        for (const event of events) {
          await bus.dispatch(event);
        }
      },
    };

    assert.equal(handler.handlerId, "test-handler");
    assert.notEqual(
      typeof publisher.publish,
      typeof undefined,
    );
    assert.equal(typeof bus.subscribe, "function");
    assert.ok(DOMAIN_EVENT_AGGREGATE_TYPES.includes("project"));
    assert.ok(DOMAIN_EVENT_AGGREGATE_TYPES.includes("notification"));
  });

  it("keeps organization id as the tenant boundary on every event", () => {
    const orgA = createDomainEvent({
      eventType: "NotificationCreated",
      organizationId: "org-a",
      aggregateId: "n-1",
      aggregateType: "notification",
      actorId: "user-a",
      payload: { recipientUserId: "user-a" },
    });
    const orgB = createDomainEvent({
      eventType: "NotificationCreated",
      organizationId: "org-b",
      aggregateId: "n-2",
      aggregateType: "notification",
      actorId: "user-b",
      payload: { recipientUserId: "user-b" },
    });

    assert.notEqual(orgA.metadata.organizationId, orgB.metadata.organizationId);
    assert.equal(orgA.metadata.organizationId, "org-a");
    assert.equal(orgB.metadata.organizationId, "org-b");
  });
});
