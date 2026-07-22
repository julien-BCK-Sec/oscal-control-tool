"use client";

import {
  controlReviewActionLabel,
  type ControlReviewAction,
} from "@/data/control-review";
import {
  controlImplementationStatusLabel,
  controlReviewStatusLabel,
  displayControlOwner,
  isControlOwnerUnassigned,
  type ControlRecordFields,
  type ControlReviewStatus,
} from "@/data/control-record";
import { ImplementationStatusBadge } from "@/components/design-system/badge/statusMaps";
import { ReviewStatusBadge } from "@/components/design-system/badge/statusMaps";
import { Button } from "@/components/design-system/button/Button";
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
 * Control workspace header — identity, labeled statuses, and desktop primary action.
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
    <header className="shrink-0 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="control-id text-sm text-accent">
            {formatControlIdDisplay(controlId)}
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{family}</p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="inline-flex items-center gap-1.5">
              <dt className="text-text-muted">Implementation:</dt>
              <dd>
                <ImplementationStatusBadge
                  status={fields.implementationStatus}
                  size="sm"
                />
                <span className="sr-only">
                  {controlImplementationStatusLabel(
                    fields.implementationStatus,
                  )}
                </span>
              </dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <dt className="text-text-muted">Review:</dt>
              <dd>
                <ReviewStatusBadge status={reviewStatus} size="sm" />
                <span className="sr-only">
                  {controlReviewStatusLabel(reviewStatus)}
                </span>
              </dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <dt className="text-text-muted">Narrative:</dt>
              <dd
                className={
                  narrativeComplete ? "text-success" : "text-text-secondary"
                }
              >
                {narrativeComplete ? "Complete" : "Incomplete"}
              </dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <dt className="text-text-muted">Owner:</dt>
              <dd
                className={
                  unassigned ? "text-text-muted" : "text-text-secondary"
                }
                role={unassigned ? "status" : undefined}
              >
                {displayControlOwner(fields.owner)}
              </dd>
            </div>
          </dl>
        </div>

        {primaryAction ? (
          <div className="hidden shrink-0 self-start lg:block">
            <Button
              variant="primary"
              disabled={pending}
              aria-busy={isPrimaryPending}
              onClick={() => onPrimaryAction(primaryAction)}
            >
              {isPrimaryPending
                ? "Working…"
                : controlReviewActionLabel(primaryAction)}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
