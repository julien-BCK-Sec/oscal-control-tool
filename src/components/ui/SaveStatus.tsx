import type { AutosaveStatus } from "@/editor/history";
import { autosaveStatusLabel } from "@/editor/history";

export type SaveStatusProps = {
  status: AutosaveStatus;
  message?: string | null;
  className?: string;
};

/**
 * Compact save-status indicator. Does not rely on colour alone.
 */
export function SaveStatus({ status, message, className = "" }: SaveStatusProps) {
  const label = autosaveStatusLabel(status);
  const isError = status === "error" || status === "conflict";
  const isPending = status === "dirty" || status === "saving";
  const prefix =
    status === "saved" || status === "clean"
      ? "✓ "
      : status === "saving"
        ? ""
        : "";

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-1 text-xs ${
        isError
          ? "font-medium text-danger"
          : isPending
            ? "font-medium text-warning"
            : "text-text-secondary"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <span>
        {prefix}
        {label}
      </span>
      {message ? (
        <span className="font-normal text-text-muted">— {message}</span>
      ) : null}
    </span>
  );
}
