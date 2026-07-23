/**
 * Domain event foundation (Milestone 02B).
 *
 * Strongly typed, organization-scoped, immutable events. This module defines
 * contracts only — no persistence, brokers, retries, or workflow automation.
 *
 * Naming convention for concrete event types: `<Aggregate><Action>`
 * (for example `ControlAssigned`, `DiscussionCreated`).
 */

/** Known aggregate kinds that emit domain events in this milestone. */
export const DOMAIN_EVENT_AGGREGATE_TYPES = [
  "project",
  "control",
  "discussion",
  "assignment",
  "notification",
  "evidence",
] as const;

export type DomainEventAggregateType =
  (typeof DOMAIN_EVENT_AGGREGATE_TYPES)[number];

/**
 * Envelope metadata shared by every domain event.
 * Identifiers are opaque strings; organizationId is the tenant boundary.
 */
export type DomainEventMetadata = {
  readonly id: string;
  readonly eventType: string;
  readonly organizationId: string;
  readonly aggregateId: string;
  readonly aggregateType: DomainEventAggregateType;
  /** Authenticated user id, or null for System / automated actors. */
  readonly actorId: string | null;
  /** Ties related events from one logical operation or request. */
  readonly correlationId: string;
  /** ISO-8601 timestamp when the business operation completed. */
  readonly occurredAt: string;
};

/**
 * Immutable domain event. Payload must be a plain DTO (no ORM entities,
 * repositories, or services).
 */
export type DomainEvent<
  TType extends string = string,
  TPayload extends object = object,
> = {
  readonly eventType: TType;
  readonly metadata: DomainEventMetadata;
  readonly payload: Readonly<TPayload>;
};

/** Input used to construct a domain event before ids/timestamps are assigned. */
export type CreateDomainEventInput<
  TType extends string = string,
  TPayload extends object = object,
> = {
  eventType: TType;
  organizationId: string;
  aggregateId: string;
  aggregateType: DomainEventAggregateType;
  actorId: string | null;
  payload: TPayload;
  /** Optional; defaults to a new UUID. */
  id?: string;
  /** Optional; defaults to a new UUID (or shared across a batch). */
  correlationId?: string;
  /** Optional; defaults to now (ISO). */
  occurredAt?: string;
};

/**
 * Handles one or more event types. Handlers must not be invoked by business
 * services directly — only via DomainEventBus.
 */
export interface DomainEventHandler<
  E extends DomainEvent = DomainEvent,
> {
  readonly handlerId: string;
  readonly eventTypes: readonly string[];
  handle(event: E): void | Promise<void>;
}

/**
 * In-process dispatcher: routes published events to registered handlers.
 * Implementation-agnostic so a future broker can replace the transport.
 */
export interface DomainEventBus {
  subscribe(handler: DomainEventHandler): void;
  unsubscribe(handlerId: string): void;
  /**
   * Dispatch an already-constructed event to matching handlers.
   * Handler failures must not propagate to the caller.
   */
  dispatch(event: DomainEvent): Promise<void>;
}

/**
 * Publication entry point for business services and authorized wrappers.
 * Publishers must not call handlers directly; they delegate to the bus.
 */
export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: readonly DomainEvent[]): Promise<void>;
}
