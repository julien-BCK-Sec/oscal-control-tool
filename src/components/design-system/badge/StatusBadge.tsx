import type { ReactNode } from "react";

export type StatusBadgeVariant =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "accent"
  | "attention";

export type StatusBadgeSize = "xs" | "sm" | "md";

const VARIANT_CLASS: Record<StatusBadgeVariant, string> = {
  neutral: "bg-surface-secondary text-text-secondary border-border",
  info: "bg-info-muted text-info border-info/25",
  warning: "bg-warning-muted text-warning border-warning/25",
  success: "bg-success-muted text-success border-success/25",
  danger: "bg-danger-muted text-danger border-danger/25",
  accent: "bg-accent-muted text-accent border-accent/25",
  attention: "bg-orange-muted text-orange border-orange/25",
};

const SIZE_CLASS: Record<StatusBadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[10px] leading-tight",
  sm: "px-1.5 py-0.5 text-[11px] leading-tight",
  md: "px-2 py-0.5 text-xs leading-tight",
};

export type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  icon?: ReactNode;
  className?: string;
};

/**
 * Unified status chip — always includes a text label (never color alone).
 */
export function StatusBadge({
  label,
  variant = "neutral",
  size = "xs",
  icon,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit max-w-full items-center gap-1 rounded-sm border font-medium tracking-wide ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </span>
  );
}
