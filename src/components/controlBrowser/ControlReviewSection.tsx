"use client";

import { useState } from "react";
import { transitionReviewStatusAction } from "@/app/actions/control-records";
import {
  controlReviewStatusLabel,
  type ControlReviewStatus,
} from "@/data/control-record";
import {
  controlReviewActionLabel,
  getAvailableReviewActions,
  type ControlReviewAction,
} from "@/data/control-review";
import { ControlReviewStatusBadge } from "@/components/controlBrowser/ControlReviewStatusBadge";

const REVIEW_HELPER_TEXT: Partial<Record<ControlReviewStatus, string>> = {
  not_reviewed: "This control has not entered the review workflow yet.",
  ready_for_review: "Waiting for a reviewer to start the review.",
  under_review: "A review is in progress.",
  changes_requested: "Address the requested changes, then resubmit.",
  approved: "Review is complete. Reopen to start a new review cycle.",
};

export type ControlReviewSectionProps = {
  projectId: string;
  controlId: string;
  reviewStatus: ControlReviewStatus;
  onReviewStatusChange: (next: ControlReviewStatus) => void;
  onTransitionSuccess: () => void;
};

export function ControlReviewSection({
  projectId,
  controlId,
  reviewStatus,
  onReviewStatusChange,
  onTransitionSuccess,
}: ControlReviewSectionProps) {
  const [pendingAction, setPendingAction] = useState<ControlReviewAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const actions = getAvailableReviewActions(reviewStatus);
  const helper = REVIEW_HELPER_TEXT[reviewStatus];
  const pending = pendingAction !== null;

  async function runAction(action: ControlReviewAction) {
    if (pending) {
      return;
    }
    setPendingAction(action);
    setError(null);
    try {
      const result = await transitionReviewStatusAction({
        projectId,
        controlId,
        action,
        expectedCurrentStatus: reviewStatus,
      });
      if (!result.ok) {
        if (result.reason === "conflict") {
          onReviewStatusChange(result.currentReviewStatus);
          setError(
            `Review status is now “${controlReviewStatusLabel(result.currentReviewStatus)}”. Refresh happened automatically — try again if needed.`,
          );
        } else if (result.reason === "invalid-transition") {
          onReviewStatusChange(result.currentReviewStatus);
          setError(result.message);
        } else {
          setError(result.message);
        }
        return;
      }
      onReviewStatusChange(result.record.reviewStatus);
      onTransitionSuccess();
    } catch {
      setError("Failed to update review status. Try again.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="max-w-3xl" aria-labelledby="control-review-heading">
      <h3
        id="control-review-heading"
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        Review
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        Review workflow is separate from implementation status and is not rolled
        back with named project versions.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ControlReviewStatusBadge reviewStatus={reviewStatus} />
        <span className="text-sm text-text-secondary">
          {controlReviewStatusLabel(reviewStatus)}
        </span>
      </div>

      {helper ? (
        <p className="mt-2 text-xs text-text-muted">{helper}</p>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => {
            const isThisPending = pendingAction === action;
            return (
              <button
                key={action}
                type="button"
                className="btn btn-primary px-3 py-1.5 text-sm"
                disabled={pending}
                aria-busy={isThisPending}
                onClick={() => void runAction(action)}
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
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
