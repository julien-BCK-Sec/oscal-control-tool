/**
 * Handler execution framework (Milestone 02B WP5).
 *
 * Provides structured logging and isolated execution. Does not implement
 * retries, workers, schedulers, or durable execution history.
 */

import type { DomainEvent, DomainEventHandler } from "./types";

export type HandlerExecutionStatus = "succeeded" | "failed";

export type HandlerExecutionResult = {
  readonly handlerId: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly organizationId: string;
  readonly status: HandlerExecutionStatus;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly errorMessage: string | null;
};

export type DomainEventLogger = {
  error(message: string, details?: Record<string, unknown>): void;
  info?(message: string, details?: Record<string, unknown>): void;
};

export const consoleDomainEventLogger: DomainEventLogger = {
  error(message, details) {
    if (details) {
      console.error(message, details);
    } else {
      console.error(message);
    }
  },
  info(message, details) {
    if (details) {
      console.info(message, details);
    } else {
      console.info(message);
    }
  },
};

/**
 * Execute a single handler and return a structured result.
 * Never throws — failures become `status: "failed"`.
 */
export async function executeDomainEventHandler(
  handler: DomainEventHandler,
  event: DomainEvent,
  logger: DomainEventLogger = consoleDomainEventLogger,
): Promise<HandlerExecutionResult> {
  const startedAt = new Date().toISOString();
  try {
    await handler.handle(event);
    const finishedAt = new Date().toISOString();
    return {
      handlerId: handler.handlerId,
      eventId: event.metadata.id,
      eventType: event.eventType,
      organizationId: event.metadata.organizationId,
      status: "succeeded",
      startedAt,
      finishedAt,
      errorMessage: null,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error(
      `[DomainEventHandler] "${handler.handlerId}" failed for ${event.eventType}`,
      {
        handlerId: handler.handlerId,
        eventId: event.metadata.id,
        eventType: event.eventType,
        organizationId: event.metadata.organizationId,
        errorMessage,
      },
    );
    return {
      handlerId: handler.handlerId,
      eventId: event.metadata.id,
      eventType: event.eventType,
      organizationId: event.metadata.organizationId,
      status: "failed",
      startedAt,
      finishedAt,
      errorMessage,
    };
  }
}

export type HandlerExecutionObserver = {
  onHandlerExecuted(result: HandlerExecutionResult): void;
};
