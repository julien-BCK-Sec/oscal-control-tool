"use client";

import {
  controlReviewActionLabel,
  type ControlReviewAction,
} from "@/data/control-review";
import type { ControlReviewStatus } from "@/data/control-record";
import { ControlReviewStatusBadge } from "@/components/controlBrowser/ControlReviewStatusBadge";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";
import { REVIEW_HELPER_TEXT } from "@/components/controlBrowser/useControlReviewTransition";

export type ControlReviewSectionProps = {
  reviewStatus: ControlReviewStatus;
  actions: readonly ControlReviewAction[];
  primaryAction: ControlReviewAction | null;
  pending: boolean;
  pendingAction: ControlReviewAction | null;
  error: string | null;
  onAction: (action: ControlReviewAction) => void;
};

/**
 * Review workflow card — presentation only; transition logic lives in the parent.
 */
export function ControlReviewSection({
  reviewStatus,
  actions,
  primaryAction,
  pending,
  pendingAction,
  error,
  onAction,
}: ControlReviewSectionProps) {
  const helper = REVIEW_HELPER_TEXT[reviewStatus];

  return (
    <SidebarCard title="Review" titleId="control-review-heading" prominent>
      <div className="flex flex-col gap-2.5">
        <ControlReviewStatusBadge reviewStatus={reviewStatus} />

        {helper ? (
          <p className="text-xs leading-relaxed text-text-secondary">{helper}</p>
        ) : null}

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {actions.map((action) => {
              const isThisPending = pendingAction === action;
              const isPrimary = action === primaryAction;
              return (
                <button
                  key={action}
                  type="button"
                  className={`btn px-3 py-1.5 text-sm ${isPrimary ? "btn-primary" : ""}`}
                  disabled={pending}
                  aria-busy={isThisPending}
                  onClick={() => onAction(action)}
                >
                  {isThisPending
                    ? "Working…"
                    : controlReviewActionLabel(action)}
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </SidebarCard>
  );
}
