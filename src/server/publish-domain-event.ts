import {
  getSharedDomainEventRuntime,
  type DomainEvent,
  type DomainEventPublisher,
} from "@/domain/events";

/**
 * Publish a domain event after a successful business operation.
 * Never throws to callers — publication/infrastructure errors are logged
 * so originating mutations stay intact.
 */
export async function publishDomainEvent(
  event: DomainEvent,
  publisher: DomainEventPublisher = getSharedDomainEventRuntime().publisher,
): Promise<void> {
  try {
    await publisher.publish(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[domain-events] failed to publish ${event.eventType} ` +
        `(org=${event.metadata.organizationId} id=${event.metadata.id}): ${message}`,
    );
  }
}

export async function publishDomainEvents(
  events: readonly DomainEvent[],
  publisher?: DomainEventPublisher,
): Promise<void> {
  for (const event of events) {
    await publishDomainEvent(event, publisher);
  }
}
