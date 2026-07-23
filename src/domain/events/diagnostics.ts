/**
 * Process-local domain event diagnostics (Milestone 02B WP6).
 *
 * Not durable across restarts. Provides recent event and handler-failure
 * inspection for operators. A future milestone may replace this with an
 * event store without changing DomainEventPublisher / DomainEventBus.
 */

import type { HandlerExecutionResult } from "./handler-framework";
import type { DomainEvent } from "./types";

export type DomainEventDiagnosticRecord = {
  readonly event: DomainEvent;
  readonly recordedAt: string;
};

export type DomainEventDiagnostics = {
  recordPublished(event: DomainEvent): void;
  recordHandlerExecution(result: HandlerExecutionResult): void;
  listRecentEvents(organizationId: string, limit?: number): DomainEventDiagnosticRecord[];
  listFailedExecutions(
    organizationId: string,
    limit?: number,
  ): HandlerExecutionResult[];
  clear(): void;
};

export type InMemoryDomainEventDiagnosticsOptions = {
  /** Maximum published events retained process-wide. */
  maxEvents?: number;
  /** Maximum failed handler executions retained process-wide. */
  maxFailures?: number;
};

export function createInMemoryDomainEventDiagnostics(
  options: InMemoryDomainEventDiagnosticsOptions = {},
): DomainEventDiagnostics {
  const maxEvents = options.maxEvents ?? 200;
  const maxFailures = options.maxFailures ?? 200;
  const events: DomainEventDiagnosticRecord[] = [];
  const failures: HandlerExecutionResult[] = [];

  function pushCapped<T>(items: T[], item: T, max: number): void {
    items.push(item);
    if (items.length > max) {
      items.splice(0, items.length - max);
    }
  }

  return {
    recordPublished(event) {
      pushCapped(
        events,
        {
          event,
          recordedAt: new Date().toISOString(),
        },
        maxEvents,
      );
    },

    recordHandlerExecution(result) {
      if (result.status !== "failed") {
        return;
      }
      pushCapped(failures, result, maxFailures);
    },

    listRecentEvents(organizationId, limit = 50) {
      const capped = Math.max(1, Math.min(limit, maxEvents));
      return events
        .filter((row) => row.event.metadata.organizationId === organizationId)
        .slice(-capped)
        .reverse();
    },

    listFailedExecutions(organizationId, limit = 50) {
      const capped = Math.max(1, Math.min(limit, maxFailures));
      return failures
        .filter((row) => row.organizationId === organizationId)
        .slice(-capped)
        .reverse();
    },

    clear() {
      events.length = 0;
      failures.length = 0;
    },
  };
}
