import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDomainEvent } from "./create-domain-event";
import { defineDomainEventHandler } from "./handler";
import {
  executeDomainEventHandler,
  type DomainEventLogger,
  type HandlerExecutionResult,
} from "./handler-framework";
import { createInProcessDomainEventBus } from "./in-process-bus";
import { createDomainEventPublisher } from "./publisher";

describe("domain event handler framework", () => {
  it("returns succeeded execution results without throwing", async () => {
    const handler = defineDomainEventHandler({
      handlerId: "ok",
      eventTypes: ["ProjectCreated"],
      async handle() {},
    });
    const event = createDomainEvent({
      eventType: "ProjectCreated",
      organizationId: "org-1",
      aggregateId: "p1",
      aggregateType: "project",
      actorId: "u1",
      payload: { name: "Demo" },
    });

    const result = await executeDomainEventHandler(handler, event);
    assert.equal(result.status, "succeeded");
    assert.equal(result.errorMessage, null);
    assert.equal(result.organizationId, "org-1");
    assert.ok(Date.parse(result.startedAt) > 0);
    assert.ok(Date.parse(result.finishedAt) > 0);
  });

  it("logs handler failures and returns failed results", async () => {
    const logs: Array<{ message: string; details?: Record<string, unknown> }> =
      [];
    const logger: DomainEventLogger = {
      error(message, details) {
        logs.push({ message, details });
      },
    };
    const handler = defineDomainEventHandler({
      handlerId: "boom",
      eventTypes: ["ProjectCreated"],
      async handle() {
        throw new Error("nope");
      },
    });
    const event = createDomainEvent({
      eventType: "ProjectCreated",
      organizationId: "org-1",
      aggregateId: "p1",
      aggregateType: "project",
      actorId: "u1",
      payload: { name: "Demo" },
    });

    const result = await executeDomainEventHandler(handler, event, logger);
    assert.equal(result.status, "failed");
    assert.equal(result.errorMessage, "nope");
    assert.equal(logs.length, 1);
    assert.match(logs[0]!.message, /boom/);
  });

  it("records execution results on the bus without failing publish", async () => {
    const results: HandlerExecutionResult[] = [];
    const bus = createInProcessDomainEventBus({
      logger: { error() {} },
      onHandlerExecuted(result) {
        results.push(result);
      },
    });
    const publisher = createDomainEventPublisher(bus);

    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "ok",
        eventTypes: ["ProjectCreated"],
        async handle() {},
      }),
    );
    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "bad",
        eventTypes: ["ProjectCreated"],
        async handle() {
          throw new Error("handler failed");
        },
      }),
    );

    await assert.doesNotReject(() =>
      publisher.publish(
        createDomainEvent({
          eventType: "ProjectCreated",
          organizationId: "org-1",
          aggregateId: "p1",
          aggregateType: "project",
          actorId: "u1",
          payload: { name: "Demo" },
        }),
      ),
    );

    assert.equal(results.length, 2);
    assert.equal(
      results.filter((result) => result.status === "succeeded").length,
      1,
    );
    assert.equal(
      results.filter((result) => result.status === "failed").length,
      1,
    );
  });
});
