import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDomainEvent } from "./create-domain-event";
import {
  defineDomainEventHandler,
  handlerMatchesEvent,
} from "./handler";
import { createInProcessDomainEventBus } from "./in-process-bus";
import { createDomainEventPublisher } from "./publisher";

describe("domain event subscriptions", () => {
  it("routes events only to handlers subscribed to that event type", async () => {
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);
    const projectHits: string[] = [];
    const discussionHits: string[] = [];

    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "project-handler",
        eventTypes: ["ProjectCreated", "ProjectUpdated"],
        async handle(event) {
          projectHits.push(event.eventType);
        },
      }),
    );
    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "discussion-handler",
        eventTypes: ["DiscussionCreated"],
        async handle(event) {
          discussionHits.push(event.eventType);
        },
      }),
    );

    await publisher.publish(
      createDomainEvent({
        eventType: "ProjectCreated",
        organizationId: "org-1",
        aggregateId: "p1",
        aggregateType: "project",
        actorId: "u1",
        payload: { name: "A" },
      }),
    );
    await publisher.publish(
      createDomainEvent({
        eventType: "DiscussionCreated",
        organizationId: "org-1",
        aggregateId: "c1",
        aggregateType: "discussion",
        actorId: "u1",
        payload: { commentId: "c1" },
      }),
    );

    assert.deepEqual(projectHits, ["ProjectCreated"]);
    assert.deepEqual(discussionHits, ["DiscussionCreated"]);
  });

  it("delivers the same event to every matching subscriber", async () => {
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);
    const handlers: string[] = [];

    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "a",
        eventTypes: ["ControlAssigned"],
        async handle() {
          handlers.push("a");
        },
      }),
    );
    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "b",
        eventTypes: ["ControlAssigned"],
        async handle() {
          handlers.push("b");
        },
      }),
    );

    await publisher.publish(
      createDomainEvent({
        eventType: "ControlAssigned",
        organizationId: "org-1",
        aggregateId: "asg-1",
        aggregateType: "assignment",
        actorId: "u1",
        payload: { controlId: "ac-1" },
      }),
    );

    assert.deepEqual(handlers, ["a", "b"]);
  });

  it("replaces a handler when the same handlerId is re-subscribed", async () => {
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);
    const hits: string[] = [];

    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "same",
        eventTypes: ["AssignmentCompleted"],
        async handle() {
          hits.push("first");
        },
      }),
    );
    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "same",
        eventTypes: ["AssignmentCompleted"],
        async handle() {
          hits.push("second");
        },
      }),
    );

    await publisher.publish(
      createDomainEvent({
        eventType: "AssignmentCompleted",
        organizationId: "org-1",
        aggregateId: "asg-1",
        aggregateType: "assignment",
        actorId: "u1",
        payload: { assignmentId: "asg-1" },
      }),
    );

    assert.deepEqual(hits, ["second"]);
  });

  it("preserves organization metadata for subscriber tenant checks", async () => {
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);
    const orgs: string[] = [];

    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "tenant-aware",
        eventTypes: ["NotificationCreated"],
        async handle(event) {
          orgs.push(event.metadata.organizationId);
        },
      }),
    );

    await publisher.publish(
      createDomainEvent({
        eventType: "NotificationCreated",
        organizationId: "org-a",
        aggregateId: "n1",
        aggregateType: "notification",
        actorId: "u1",
        payload: { recipientUserId: "u1" },
      }),
    );
    await publisher.publish(
      createDomainEvent({
        eventType: "NotificationCreated",
        organizationId: "org-b",
        aggregateId: "n2",
        aggregateType: "notification",
        actorId: "u2",
        payload: { recipientUserId: "u2" },
      }),
    );

    assert.deepEqual(orgs, ["org-a", "org-b"]);
  });

  it("exposes a pure routing predicate for handler matching", () => {
    const handler = defineDomainEventHandler({
      handlerId: "match",
      eventTypes: ["DiscussionResolved"],
      handle() {},
    });

    assert.equal(
      handlerMatchesEvent(handler, { eventType: "DiscussionResolved" }),
      true,
    );
    assert.equal(
      handlerMatchesEvent(handler, { eventType: "DiscussionCreated" }),
      false,
    );
  });

  it("rejects incomplete handler definitions", () => {
    assert.throws(
      () =>
        defineDomainEventHandler({
          handlerId: "  ",
          eventTypes: ["ProjectCreated"],
          handle() {},
        }),
      /handlerId/,
    );
    assert.throws(
      () =>
        defineDomainEventHandler({
          handlerId: "empty-types",
          eventTypes: [],
          handle() {},
        }),
      /event type/,
    );
  });
});
