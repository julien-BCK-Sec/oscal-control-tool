import type { DomainEvent, DomainEventBus, DomainEventPublisher } from "./types";

export type DomainEventPublisherOptions = {
  /**
   * Optional hook after an event is accepted for publication and before
   * (or around) bus dispatch. Reserved for future outbox persistence.
   */
  beforeDispatch?: (event: DomainEvent) => void | Promise<void>;
};

/**
 * DomainEventPublisher that validates organization scope then delegates to
 * DomainEventBus. Business services depend on this interface only.
 */
export function createDomainEventPublisher(
  bus: DomainEventBus,
  options: DomainEventPublisherOptions = {},
): DomainEventPublisher {
  async function publishOne(event: DomainEvent): Promise<void> {
    if (!event.metadata.organizationId.trim()) {
      throw new Error(
        "Cannot publish a domain event without organizationId metadata.",
      );
    }
    if (event.eventType !== event.metadata.eventType) {
      throw new Error(
        `Domain event type mismatch: eventType=${event.eventType} metadata.eventType=${event.metadata.eventType}.`,
      );
    }

    if (options.beforeDispatch) {
      await options.beforeDispatch(event);
    }

    await bus.dispatch(event);
  }

  return {
    publish(event: DomainEvent): Promise<void> {
      return publishOne(event);
    },

    async publishAll(events: readonly DomainEvent[]): Promise<void> {
      for (const event of events) {
        await publishOne(event);
      }
    },
  };
}
