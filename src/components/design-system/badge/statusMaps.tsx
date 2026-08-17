import {
  controlImplementationStatusLabel,
  controlReviewStatusLabel,
  type ControlImplementationStatus,
  type ControlReviewStatus,
} from "@/data/control-record";
import {
  controlEvidenceCoverageShortLabel,
  evidenceFreshnessLabel,
  type ControlEvidenceCoverageState,
  type EvidenceFreshness,
} from "@/data/evidence";
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

const COVERAGE_VARIANT: Record<
  ControlEvidenceCoverageState,
  StatusBadgeVariant
> = {
  not_required: "neutral",
  optional_absent: "info",
  optional_present: "info",
  required_missing: "danger",
  required_present: "success",
};

const FRESHNESS_VARIANT: Record<EvidenceFreshness, StatusBadgeVariant> = {
  current: "success",
  due_soon: "warning",
  overdue: "danger",
  no_review_date: "neutral",
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

export type EvidenceCoverageBadgeProps = {
  state: ControlEvidenceCoverageState;
  label?: string;
  size?: StatusBadgeSize;
  className?: string;
};

export function EvidenceCoverageBadge({
  state,
  label,
  size = "xs",
  className,
}: EvidenceCoverageBadgeProps) {
  return (
    <StatusBadge
      label={label ?? controlEvidenceCoverageShortLabel(state)}
      variant={COVERAGE_VARIANT[state]}
      size={size}
      className={className}
    />
  );
}

export type EvidenceFreshnessBadgeProps = {
  freshness: EvidenceFreshness;
  size?: StatusBadgeSize;
  className?: string;
};

export function EvidenceFreshnessBadge({
  freshness,
  size = "xs",
  className,
}: EvidenceFreshnessBadgeProps) {
  return (
    <StatusBadge
      label={evidenceFreshnessLabel(freshness)}
      variant={FRESHNESS_VARIANT[freshness]}
      size={size}
      className={className}
    />
  );
}
