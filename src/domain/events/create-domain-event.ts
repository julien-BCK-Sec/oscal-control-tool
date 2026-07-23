import { randomUUID } from "node:crypto";
import type {
  CreateDomainEventInput,
  DomainEvent,
  DomainEventMetadata,
} from "./types";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }

  for (const key of Reflect.ownKeys(value as object)) {
    const child = (value as Record<string | symbol, unknown>)[key];
    if (child !== null && typeof child === "object") {
      deepFreeze(child);
    }
  }

  return Object.freeze(value);
}

function assertNonEmpty(field: string, value: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Domain event ${field} is required.`);
  }
}

function assertOrganizationScoped(organizationId: string): void {
  assertNonEmpty("organizationId", organizationId);
}

/**
 * Build an immutable domain event with stable metadata.
 * Freezes metadata and payload so callers cannot mutate after publication prep.
 */
export function createDomainEvent<
  TType extends string,
  TPayload extends object,
>(
  input: CreateDomainEventInput<TType, TPayload>,
): DomainEvent<TType, TPayload> {
  assertNonEmpty("eventType", input.eventType);
  assertOrganizationScoped(input.organizationId);
  assertNonEmpty("aggregateId", input.aggregateId);
  assertNonEmpty("aggregateType", input.aggregateType);

  if (input.payload === null || typeof input.payload !== "object") {
    throw new Error("Domain event payload must be a plain object DTO.");
  }

  const metadata: DomainEventMetadata = Object.freeze({
    id: input.id?.trim() || randomUUID(),
    eventType: input.eventType,
    organizationId: input.organizationId.trim(),
    aggregateId: input.aggregateId.trim(),
    aggregateType: input.aggregateType,
    actorId: input.actorId,
    correlationId: input.correlationId?.trim() || randomUUID(),
    occurredAt: input.occurredAt?.trim() || new Date().toISOString(),
  });

  const event: DomainEvent<TType, TPayload> = Object.freeze({
    eventType: input.eventType,
    metadata,
    payload: deepFreeze({ ...input.payload }),
  });

  return event;
}
