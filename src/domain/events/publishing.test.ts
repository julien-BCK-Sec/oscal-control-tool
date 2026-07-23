import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDomainEvent } from "./create-domain-event";
import { createInProcessDomainEventBus } from "./in-process-bus";
import { createDomainEventPublisher } from "./publisher";
import type { DomainEvent, DomainEventHandler } from "./types";

function sampleEvent(
  overrides: Partial<{
    eventType: string;
    organizationId: string;
    aggregateId: string;
  }> = {},
): DomainEvent {
  return createDomainEvent({
    eventType: overrides.eventType ?? "ProjectCreated",
    organizationId: overrides.organizationId ?? "org-1",
    aggregateId: overrides.aggregateId ?? "proj-1",
    aggregateType: "project",
    actorId: "user-1",
    payload: { name: "Demo" },
  });
}

describe("domain event publishing infrastructure", () => {
  it("publishes through the publisher into the bus without calling handlers directly", async () => {
    const received: string[] = [];
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);

    bus.subscribe({
      handlerId: "recorder",
      eventTypes: ["ProjectCreated"],
      async handle(event) {
        received.push(event.metadata.id);
      },
    });

    const event = sampleEvent();
    await publisher.publish(event);

    assert.deepEqual(received, [event.metadata.id]);
  });

  it("runs beforeDispatch then bus dispatch for lifecycle hooks", async () => {
    const order: string[] = [];
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus, {
      async beforeDispatch(event) {
        order.push(`before:${event.eventType}`);
      },
    });

    bus.subscribe({
      handlerId: "handler",
      eventTypes: ["ProjectCreated"],
      async handle() {
        order.push("handle");
      },
    });

    await publisher.publish(sampleEvent());
    assert.deepEqual(order, ["before:ProjectCreated", "handle"]);
  });

  it("publishes multiple events in order", async () => {
    const types: string[] = [];
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);

    bus.subscribe({
      handlerId: "recorder",
      eventTypes: ["ProjectCreated", "ProjectUpdated"],
      async handle(event) {
        types.push(event.eventType);
      },
    });

    await publisher.publishAll([
      sampleEvent({ eventType: "ProjectCreated", aggregateId: "a" }),
      sampleEvent({ eventType: "ProjectUpdated", aggregateId: "a" }),
    ]);

    assert.deepEqual(types, ["ProjectCreated", "ProjectUpdated"]);
  });

  it("isolates handler failures from the publish caller", async () => {
    const errors: string[] = [];
    const bus = createInProcessDomainEventBus({
      onHandlerError(error, context) {
        errors.push(`${context.handlerId}:${String(error)}`);
      },
    });
    const publisher = createDomainEventPublisher(bus);
    let secondRan = false;

    bus.subscribe({
      handlerId: "boom",
      eventTypes: ["ProjectCreated"],
      async handle() {
        throw new Error("handler exploded");
      },
    });
    bus.subscribe({
      handlerId: "ok",
      eventTypes: ["ProjectCreated"],
      async handle() {
        secondRan = true;
      },
    });

    await assert.doesNotReject(() => publisher.publish(sampleEvent()));
    assert.equal(secondRan, true);
    assert.equal(errors.length, 1);
    assert.match(errors[0]!, /boom:Error: handler exploded/);
  });

  it("rejects publish when organizationId is missing", async () => {
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);
    const event = sampleEvent();
    const broken = {
      ...event,
      metadata: Object.freeze({
        ...event.metadata,
        organizationId: "   ",
      }),
    } as DomainEvent;

    await assert.rejects(
      () => publisher.publish(broken),
      /organizationId/,
    );
  });

  it("registers and unregisters handlers on the bus", async () => {
    const received: string[] = [];
    const bus = createInProcessDomainEventBus();
    const publisher = createDomainEventPublisher(bus);
    const handler: DomainEventHandler = {
      handlerId: "temp",
      eventTypes: ["ProjectCreated"],
      async handle(event) {
        received.push(event.eventType);
      },
    };

    bus.subscribe(handler);
    await publisher.publish(sampleEvent());
    bus.unsubscribe("temp");
    await publisher.publish(sampleEvent());

    assert.deepEqual(received, ["ProjectCreated"]);
  });
});
