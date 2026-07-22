import {
  ReviewStatusBadge,
  type ReviewStatusBadgeProps,
} from "@/components/design-system/badge/statusMaps";
import type { ControlReviewStatus } from "@/data/control-record";

export type ControlReviewStatusBadgeProps = {
  reviewStatus: ControlReviewStatus;
  className?: string;
};

/** @deprecated Prefer ReviewStatusBadge from design-system. */
export function ControlReviewStatusBadge({
  reviewStatus,
  className,
}: ControlReviewStatusBadgeProps) {
  return <ReviewStatusBadge status={reviewStatus} className={className} />;
}

export type { ReviewStatusBadgeProps };
