import {
  controlImplementationStatusLabel,
  type ControlImplementationStatus,
} from "@/data/control-record";

const IMPLEMENTATION_STATUS_BADGE_CLASS: Record<
  ControlImplementationStatus,
  string
> = {
  draft: "bg-surface-secondary text-text-secondary border-border",
  in_review: "bg-accent-muted text-accent border-accent/25",
  approved: "bg-success-muted text-success border-success/25",
  implemented: "bg-teal-muted text-teal border-teal/25",
  deprecated: "bg-danger-muted text-danger border-danger/25",
};

export type ControlStatusBadgeProps = {
  implementationStatus: ControlImplementationStatus;
  className?: string;
};

export function ControlStatusBadge({
  implementationStatus,
  className = "",
}: ControlStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${IMPLEMENTATION_STATUS_BADGE_CLASS[implementationStatus]} ${className}`}
    >
      {controlImplementationStatusLabel(implementationStatus)}
    </span>
  );
}
