import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDomainEvent,
  createDomainEventPublisher,
  createDomainEventRuntime,
  createInMemoryDomainEventDiagnostics,
  createInProcessDomainEventBus,
  defineDomainEventHandler,
} from "@/domain/events";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { roleHasPermission } from "@/authz/permissions";
import {
  listFailedDomainEventExecutionsForOrg,
  listRecentDomainEventsForOrg,
} from "./authorized-domain-events";

function ctx(
  organizationId: string,
  role: OrgRole,
  userId = "user-1",
): OrgContext {
  return { userId, organizationId, role };
}

describe("domain event authorization", () => {
  it("grants diagnostics only to organization admins", () => {
    assert.equal(
      roleHasPermission("organization_admin", "event.diagnostics.read"),
      true,
    );
    for (const role of [
      "project_manager",
      "author",
      "reviewer",
      "viewer",
    ] as const) {
      assert.equal(
        roleHasPermission(role, "event.diagnostics.read"),
        false,
        `${role} must not read event diagnostics`,
      );
    }
  });

  it("scopes diagnostics to the caller's organization", async () => {
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

    const adminA = listRecentDomainEventsForOrg(
      ctx("org-a", "organization_admin"),
      { diagnostics: runtime.diagnostics },
    );
    assert.equal(adminA.length, 1);
    assert.equal(adminA[0]!.event.metadata.organizationId, "org-a");

    const adminB = listRecentDomainEventsForOrg(
      ctx("org-b", "organization_admin"),
      { diagnostics: runtime.diagnostics },
    );
    assert.equal(adminB.length, 1);
    assert.equal(adminB[0]!.event.metadata.organizationId, "org-b");
  });

  it("denies non-admin roles from reading diagnostics", () => {
    const runtime = createDomainEventRuntime();
    assert.throws(
      () =>
        listRecentDomainEventsForOrg(ctx("org-a", "project_manager"), {
          diagnostics: runtime.diagnostics,
        }),
      AuthorizationError,
    );
    assert.throws(
      () =>
        listFailedDomainEventExecutionsForOrg(ctx("org-a", "author"), {
          diagnostics: runtime.diagnostics,
        }),
      AuthorizationError,
    );
  });

  it("keeps failed-handler diagnostics organization scoped", async () => {
    const diagnostics = createInMemoryDomainEventDiagnostics();
    const bus = createInProcessDomainEventBus({
      logger: { error() {} },
      onHandlerExecuted(result) {
        diagnostics.recordHandlerExecution(result);
      },
    });
    const publisher = createDomainEventPublisher(bus, {
      async beforeDispatch(event) {
        diagnostics.recordPublished(event);
      },
    });
    bus.subscribe(
      defineDomainEventHandler({
        handlerId: "fail",
        eventTypes: ["ProjectCreated"],
        async handle() {
          throw new Error("x");
        },
      }),
    );
    await publisher.publish(
      createDomainEvent({
        eventType: "ProjectCreated",
        organizationId: "org-a",
        aggregateId: "p1",
        aggregateType: "project",
        actorId: "u1",
        payload: { name: "A" },
      }),
    );

    const failures = listFailedDomainEventExecutionsForOrg(
      ctx("org-a", "organization_admin"),
      { diagnostics },
    );
    assert.equal(failures.length, 1);
    assert.equal(failures[0]!.organizationId, "org-a");
    assert.deepEqual(
      listFailedDomainEventExecutionsForOrg(
        ctx("org-b", "organization_admin"),
        { diagnostics },
      ),
      [],
    );
  });
});
