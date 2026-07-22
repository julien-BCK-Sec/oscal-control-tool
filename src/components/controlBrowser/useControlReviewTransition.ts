"use client";

import { useCallback, useState } from "react";
import { transitionReviewStatusAction } from "@/app/actions/control-records";
import {
  controlReviewStatusLabel,
  type ControlReviewStatus,
} from "@/data/control-record";
import {
  getAvailableReviewActions,
  type ControlReviewAction,
} from "@/data/control-review";

export const REVIEW_HELPER_TEXT: Record<ControlReviewStatus, string> = {
  not_reviewed: "This control has not entered the review workflow yet.",
  ready_for_review: "Waiting for a reviewer.",
  under_review: "Reviewer is evaluating this control.",
  changes_requested: "Address the requested changes, then resubmit.",
  approved: "Approved.",
};

/**
 * Prefer Approve when under review; otherwise the first legal action.
 */
export function getPrimaryReviewAction(
  reviewStatus: ControlReviewStatus,
): ControlReviewAction | null {
  const actions = getAvailableReviewActions(reviewStatus);
  if (actions.includes("approve_review")) {
    return "approve_review";
  }
  return actions[0] ?? null;
}

export type UseControlReviewTransitionArgs = {
  projectId: string;
  controlId: string;
  reviewStatus: ControlReviewStatus;
  onReviewStatusChange: (next: ControlReviewStatus) => void;
  onTransitionSuccess: () => void;
};

/**
 * Shared review transition UI state — presentation only; uses existing Server Action.
 * Remount (key by controlId) to reset pending/error when switching controls.
 */
export function useControlReviewTransition({
  projectId,
  controlId,
  reviewStatus,
  onReviewStatusChange,
  onTransitionSuccess,
}: UseControlReviewTransitionArgs) {
  const [pendingAction, setPendingAction] = useState<ControlReviewAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const actions = getAvailableReviewActions(reviewStatus);
  const primaryAction = getPrimaryReviewAction(reviewStatus);
  const pending = pendingAction !== null;
  const helper = REVIEW_HELPER_TEXT[reviewStatus];

  const runAction = useCallback(
    async (action: ControlReviewAction) => {
      if (pendingAction !== null) {
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
    },
    [
      pendingAction,
      projectId,
      controlId,
      reviewStatus,
      onReviewStatusChange,
      onTransitionSuccess,
    ],
  );

  return {
    actions,
    primaryAction,
    pending,
    pendingAction,
    error,
    helper,
    runAction,
  };
}
