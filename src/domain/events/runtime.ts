/**
 * Process runtime wiring for domain events (Milestone 02B).
 *
 * Keeps publisher, bus, and diagnostics behind stable interfaces so
 * Workflow Automation (02C) can subscribe without changing publishers.
 */

import { createInMemoryDomainEventDiagnostics } from "./diagnostics";
import type { DomainEventDiagnostics } from "./diagnostics";
import { createInProcessDomainEventBus } from "./in-process-bus";
import { createDomainEventPublisher } from "./publisher";
import type { DomainEventBus, DomainEventPublisher } from "./types";

export type DomainEventRuntime = {
  bus: DomainEventBus;
  publisher: DomainEventPublisher;
  diagnostics: DomainEventDiagnostics;
};

export function createDomainEventRuntime(): DomainEventRuntime {
  const diagnostics = createInMemoryDomainEventDiagnostics();
  const bus = createInProcessDomainEventBus({
    onHandlerExecuted(result) {
      diagnostics.recordHandlerExecution(result);
    },
  });
  const publisher = createDomainEventPublisher(bus, {
    async beforeDispatch(event) {
      diagnostics.recordPublished(event);
    },
  });

  return { bus, publisher, diagnostics };
}

let sharedRuntime: DomainEventRuntime | null = null;

/** Shared process runtime for server paths. Tests should prefer createDomainEventRuntime(). */
export function getSharedDomainEventRuntime(): DomainEventRuntime {
  if (!sharedRuntime) {
    sharedRuntime = createDomainEventRuntime();
  }
  return sharedRuntime;
}

/** Test helper to replace or clear the shared runtime. */
export function setSharedDomainEventRuntime(
  runtime: DomainEventRuntime | null,
): void {
  sharedRuntime = runtime;
}
