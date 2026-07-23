import {
  getSharedDomainEventRuntime,
  type DomainEventDiagnosticRecord,
  type DomainEventDiagnostics,
  type HandlerExecutionResult,
} from "@/domain/events";
import { requirePermission, type OrgContext } from "@/authz/authorize";

/**
 * Authorized domain-event diagnostics (Milestone 02B WP8).
 * Organization-scoped and limited to event.diagnostics.read.
 * Process-local history is not durable across restarts.
 */

function diagnosticsOrShared(
  diagnostics?: DomainEventDiagnostics,
): DomainEventDiagnostics {
  return diagnostics ?? getSharedDomainEventRuntime().diagnostics;
}

export function listRecentDomainEventsForOrg(
  ctx: OrgContext,
  options?: { limit?: number; diagnostics?: DomainEventDiagnostics },
): DomainEventDiagnosticRecord[] {
  requirePermission(ctx, ctx.organizationId, "event.diagnostics.read");
  return diagnosticsOrShared(options?.diagnostics).listRecentEvents(
    ctx.organizationId,
    options?.limit,
  );
}

export function listFailedDomainEventExecutionsForOrg(
  ctx: OrgContext,
  options?: { limit?: number; diagnostics?: DomainEventDiagnostics },
): HandlerExecutionResult[] {
  requirePermission(ctx, ctx.organizationId, "event.diagnostics.read");
  return diagnosticsOrShared(options?.diagnostics).listFailedExecutions(
    ctx.organizationId,
    options?.limit,
  );
}
