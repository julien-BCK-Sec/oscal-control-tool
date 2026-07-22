"use client";

import {
  controlReviewActionLabel,
  type ControlReviewAction,
} from "@/data/control-review";
import type { ControlReviewStatus } from "@/data/control-record";
import { ReviewStatusBadge } from "@/components/design-system/badge/statusMaps";
import { Button } from "@/components/design-system/button/Button";
import { CardFooter } from "@/components/design-system/card/Card";
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
  /**
   * When true (desktop), omit the primary action from this card because the
   * control header already exposes it. Mobile always shows all actions here.
   */
  omitPrimaryOnDesktop?: boolean;
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
  omitPrimaryOnDesktop = true,
}: ControlReviewSectionProps) {
  const helper = REVIEW_HELPER_TEXT[reviewStatus];

  return (
    <SidebarCard title="Review" titleId="control-review-heading" prominent>
      <div className="flex flex-col gap-2">
        <div className="w-fit">
          <ReviewStatusBadge status={reviewStatus} size="sm" />
        </div>

        {helper ? (
          <p className="text-xs leading-relaxed text-text-secondary">{helper}</p>
        ) : null}

        {actions.length > 0 ? (
          <CardFooter className="mt-1">
            {actions.map((action) => {
              const isThisPending = pendingAction === action;
              const isPrimary = action === primaryAction;
              const hideOnDesktop =
                omitPrimaryOnDesktop && isPrimary && primaryAction !== null;
              return (
                <Button
                  key={action}
                  variant={isPrimary ? "primary" : "default"}
                  size="sm"
                  disabled={pending}
                  aria-busy={isThisPending}
                  className={hideOnDesktop ? "lg:hidden" : undefined}
                  onClick={() => onAction(action)}
                >
                  {isThisPending
                    ? "Working…"
                    : controlReviewActionLabel(action)}
                </Button>
              );
            })}
          </CardFooter>
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
