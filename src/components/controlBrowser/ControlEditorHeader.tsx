"use client";

import {
  controlReviewActionLabel,
  type ControlReviewAction,
} from "@/data/control-review";
import {
  displayControlOwner,
  isControlOwnerUnassigned,
  type ControlRecordFields,
  type ControlReviewStatus,
} from "@/data/control-record";
import { ControlStatusBadge } from "@/components/controlBrowser/ControlStatusBadge";
import { ControlReviewStatusBadge } from "@/components/controlBrowser/ControlReviewStatusBadge";
import { formatControlIdDisplay } from "@/components/controlBrowser/presentation";

export type ControlEditorHeaderProps = {
  controlId: string;
  title: string;
  family: string;
  fields: ControlRecordFields;
  reviewStatus: ControlReviewStatus;
  narrativeComplete: boolean;
  primaryAction: ControlReviewAction | null;
  pending: boolean;
  pendingAction: ControlReviewAction | null;
  onPrimaryAction: (action: ControlReviewAction) => void;
};

/**
 * Control workspace header — identity, status, and primary review action.
 * Remains visible above the scrollable editor body.
 */
export function ControlEditorHeader({
  controlId,
  title,
  family,
  fields,
  reviewStatus,
  narrativeComplete,
  primaryAction,
  pending,
  pendingAction,
  onPrimaryAction,
}: ControlEditorHeaderProps) {
  const unassigned = isControlOwnerUnassigned(fields.owner);
  const isPrimaryPending =
    primaryAction !== null && pendingAction === primaryAction;

  return (
    <header className="shrink-0 border-b border-border bg-surface px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="control-id text-sm text-accent">
            {formatControlIdDisplay(controlId)}
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{family}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ControlStatusBadge
              implementationStatus={fields.implementationStatus}
            />
            <ControlReviewStatusBadge reviewStatus={reviewStatus} />
            <span
              className={`text-xs ${
                narrativeComplete ? "text-success" : "text-warning"
              }`}
              title={
                narrativeComplete
                  ? "Narrative is complete"
                  : "Narrative is incomplete"
              }
            >
              <span aria-hidden="true">{narrativeComplete ? "✓ " : "○ "}</span>
              {narrativeComplete ? "Complete" : "Incomplete"}
            </span>
          </div>

          {!unassigned ? (
            <p className="mt-2 text-sm text-text-secondary">
              <span className="text-text-muted">Owner:</span>{" "}
              {displayControlOwner(fields.owner)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-warning" role="status">
              No owner assigned
            </p>
          )}
        </div>

        {primaryAction ? (
          <div className="shrink-0 self-start">
            <button
              type="button"
              className="btn btn-primary px-4 py-2 text-sm"
              disabled={pending}
              aria-busy={isPrimaryPending}
              onClick={() => onPrimaryAction(primaryAction)}
            >
              {isPrimaryPending
                ? "Working…"
                : controlReviewActionLabel(primaryAction)}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
