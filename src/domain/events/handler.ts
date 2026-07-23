import type { DomainEvent, DomainEventHandler } from "./types";

export type DefineDomainEventHandlerInput<
  E extends DomainEvent = DomainEvent,
> = {
  handlerId: string;
  eventTypes: readonly string[];
  handle: (event: E) => void | Promise<void>;
};

/**
 * Build a DomainEventHandler for bus registration.
 * Keeps handler construction consistent and typed at the call site.
 */
export function defineDomainEventHandler<
  E extends DomainEvent = DomainEvent,
>(input: DefineDomainEventHandlerInput<E>): DomainEventHandler<E> {
  if (!input.handlerId.trim()) {
    throw new Error("DomainEventHandler.handlerId is required.");
  }
  if (input.eventTypes.length === 0) {
    throw new Error(
      `DomainEventHandler "${input.handlerId}" must declare at least one event type.`,
    );
  }

  return {
    handlerId: input.handlerId.trim(),
    eventTypes: Object.freeze([...input.eventTypes]),
    handle: (event) => input.handle(event as E),
  };
}

/**
 * Whether a handler should receive the given event based on declared types.
 * Pure routing predicate used by tests and diagnostics.
 */
export function handlerMatchesEvent(
  handler: Pick<DomainEventHandler, "eventTypes">,
  event: Pick<DomainEvent, "eventType">,
): boolean {
  return handler.eventTypes.includes(event.eventType);
}
