import {
  ImplementationStatusBadge,
  type ImplementationStatusBadgeProps,
} from "@/components/design-system/badge/statusMaps";
import type { ControlImplementationStatus } from "@/data/control-record";

export type ControlStatusBadgeProps = {
  implementationStatus: ControlImplementationStatus;
  className?: string;
};

/** @deprecated Prefer ImplementationStatusBadge from design-system. */
export function ControlStatusBadge({
  implementationStatus,
  className,
}: ControlStatusBadgeProps) {
  return (
    <ImplementationStatusBadge
      status={implementationStatus}
      className={className}
    />
  );
}

export type { ImplementationStatusBadgeProps };
