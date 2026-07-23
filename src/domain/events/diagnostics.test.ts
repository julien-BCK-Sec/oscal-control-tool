import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDomainEvent } from "./create-domain-event";
import { createInMemoryDomainEventDiagnostics } from "./diagnostics";
import { defineDomainEventHandler } from "./handler";
import { createDomainEventRuntime } from "./runtime";

describe("domain event diagnostics", () => {
  it("records recent published events scoped by organization", async () => {
    const runtime = createDomainEventRuntime();

    await runtime.publisher.publish(
      createDomainEvent({
        eventType: "ProjectCreated",
        organizationId: "org-a",
        aggregateId: "p1",
        aggregateType: "project",
        actorId: "u1",
        payload: { name: "A" },
      }),
    );
    await runtime.publisher.publish(
      createDomainEvent({
        eventType: "ProjectCreated",
        organizationId: "org-b",
        aggregateId: "p2",
        aggregateType: "project",
        actorId: "u2",
        payload: { name: "B" },
      }),
    );

    const orgA = runtime.diagnostics.listRecentEvents("org-a");
    const orgB = runtime.diagnostics.listRecentEvents("org-b");

    assert.equal(orgA.length, 1);
    assert.equal(orgA[0]!.event.metadata.organizationId, "org-a");
    assert.equal(orgB.length, 1);
    assert.equal(orgB[0]!.event.metadata.organizationId, "org-b");
    assert.ok(Date.parse(orgA[0]!.recordedAt) > 0);
  });

  it("records failed handler executions with timestamps", async () => {
    const runtime = createDomainEventRuntime();
    runtime.bus.subscribe(
      defineDomainEventHandler({
        handlerId: "failing",
        eventTypes: ["ProjectCreated"],
        async handle() {
          throw new Error("boom");
        },
      }),
    );

    await runtime.publisher.publish(
      createDomainEvent({
        eventType: "ProjectCreated",
        organizationId: "org-1",
        aggregateId: "p1",
        aggregateType: "project",
        actorId: "u1",
        payload: { name: "Demo" },
      }),
    );

    const failures = runtime.diagnostics.listFailedExecutions("org-1");
    assert.equal(failures.length, 1);
    assert.equal(failures[0]!.status, "failed");
    assert.equal(failures[0]!.errorMessage, "boom");
    assert.ok(Date.parse(failures[0]!.startedAt) > 0);
    assert.ok(Date.parse(failures[0]!.finishedAt) > 0);
    assert.equal(
      runtime.diagnostics.listFailedExecutions("other-org").length,
      0,
    );
  });

  it("caps retained history in the in-memory diagnostics buffer", () => {
    const diagnostics = createInMemoryDomainEventDiagnostics({
      maxEvents: 2,
      maxFailures: 2,
    });

    for (let i = 0; i < 3; i += 1) {
      diagnostics.recordPublished(
        createDomainEvent({
          eventType: "ProjectCreated",
          organizationId: "org-1",
          aggregateId: `p${i}`,
          aggregateType: "project",
          actorId: "u1",
          payload: { name: `P${i}` },
        }),
      );
    }

    const recent = diagnostics.listRecentEvents("org-1", 10);
    assert.equal(recent.length, 2);
    assert.equal(recent[0]!.event.metadata.aggregateId, "p2");
    assert.equal(recent[1]!.event.metadata.aggregateId, "p1");
  });
});
