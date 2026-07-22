import {
  controlReviewStatusLabel,
  type ControlReviewStatus,
} from "@/data/control-record";

const REVIEW_STATUS_BADGE_CLASS: Record<ControlReviewStatus, string> = {
  not_reviewed: "bg-surface-secondary text-text-secondary border-border",
  ready_for_review: "bg-accent-muted text-accent border-accent/25",
  under_review: "bg-warning-muted text-warning border-warning/25",
  changes_requested: "bg-orange-muted text-orange border-orange/25",
  approved: "bg-success-muted text-success border-success/25",
};

export type ControlReviewStatusBadgeProps = {
  reviewStatus: ControlReviewStatus;
  className?: string;
};

export function ControlReviewStatusBadge({
  reviewStatus,
  className = "",
}: ControlReviewStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${REVIEW_STATUS_BADGE_CLASS[reviewStatus]} ${className}`}
    >
      {controlReviewStatusLabel(reviewStatus)}
    </span>
  );
}
