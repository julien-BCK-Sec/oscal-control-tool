import type { DomainEvent, DomainEventBus, DomainEventHandler } from "./types";

export type DomainEventBusOptions = {
  /**
   * Called when a handler throws or rejects.
   * Failures never propagate to publish/dispatch callers.
   */
  onHandlerError?: (
    error: unknown,
    context: {
      handlerId: string;
      event: DomainEvent;
    },
  ) => void;
};

function defaultHandlerErrorLog(
  error: unknown,
  context: { handlerId: string; event: DomainEvent },
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[DomainEventBus] handler "${context.handlerId}" failed for ${context.event.eventType} ` +
      `(org=${context.event.metadata.organizationId} id=${context.event.metadata.id}): ${message}`,
  );
}

/**
 * In-process DomainEventBus.
 *
 * Delivery is same-process only. No durability, retries, ordering across
 * instances, or external broker. A future transport can implement the same
 * DomainEventBus interface without changing publishers.
 */
export function createInProcessDomainEventBus(
  options: DomainEventBusOptions = {},
): DomainEventBus {
  const handlers = new Map<string, DomainEventHandler>();
  const onHandlerError = options.onHandlerError ?? defaultHandlerErrorLog;

  return {
    subscribe(handler: DomainEventHandler): void {
      if (!handler.handlerId.trim()) {
        throw new Error("DomainEventHandler.handlerId is required.");
      }
      if (handler.eventTypes.length === 0) {
        throw new Error(
          `DomainEventHandler "${handler.handlerId}" must declare at least one event type.`,
        );
      }
      handlers.set(handler.handlerId, handler);
    },

    unsubscribe(handlerId: string): void {
      handlers.delete(handlerId);
    },

    async dispatch(event: DomainEvent): Promise<void> {
      const matched = [...handlers.values()].filter((handler) =>
        handler.eventTypes.includes(event.eventType),
      );

      for (const handler of matched) {
        try {
          await handler.handle(event);
        } catch (error) {
          onHandlerError(error, {
            handlerId: handler.handlerId,
            event,
          });
        }
      }
    },
  };
}
