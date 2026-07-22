import {
  controlImplementationStatusLabel,
  controlReviewStatusLabel,
  type ControlImplementationStatus,
  type ControlReviewStatus,
} from "@/data/control-record";
import {
  StatusBadge,
  type StatusBadgeSize,
  type StatusBadgeVariant,
} from "@/components/design-system/badge/StatusBadge";

const IMPLEMENTATION_VARIANT: Record<
  ControlImplementationStatus,
  StatusBadgeVariant
> = {
  draft: "neutral",
  in_review: "accent",
  approved: "success",
  implemented: "success",
  deprecated: "danger",
};

const REVIEW_VARIANT: Record<ControlReviewStatus, StatusBadgeVariant> = {
  not_reviewed: "neutral",
  ready_for_review: "info",
  under_review: "warning",
  changes_requested: "attention",
  approved: "success",
};

export type ImplementationStatusBadgeProps = {
  status: ControlImplementationStatus;
  size?: StatusBadgeSize;
  className?: string;
};

export function ImplementationStatusBadge({
  status,
  size = "xs",
  className,
}: ImplementationStatusBadgeProps) {
  return (
    <StatusBadge
      label={controlImplementationStatusLabel(status)}
      variant={IMPLEMENTATION_VARIANT[status]}
      size={size}
      className={className}
    />
  );
}

export type ReviewStatusBadgeProps = {
  status: ControlReviewStatus;
  size?: StatusBadgeSize;
  className?: string;
};

export function ReviewStatusBadge({
  status,
  size = "xs",
  className,
}: ReviewStatusBadgeProps) {
  return (
    <StatusBadge
      label={controlReviewStatusLabel(status)}
      variant={REVIEW_VARIANT[status]}
      size={size}
      className={className}
    />
  );
}
