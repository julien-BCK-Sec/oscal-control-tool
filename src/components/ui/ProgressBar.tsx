import type { CompletionProgress } from "@/domain";

export type ProgressBarProps = {
  progress: CompletionProgress;
  /** Accessible name for the progressbar. */
  label: string;
  className?: string;
  /** Visual size. */
  size?: "sm" | "md";
};

export function ProgressBar({
  progress,
  label,
  className = "",
  size = "sm",
}: ProgressBarProps) {
  const height = size === "md" ? "h-2" : "h-1.5";
  const value = Math.min(100, Math.max(0, progress.percent));

  return (
    <div
      className={`w-full overflow-hidden rounded-sm bg-surface-secondary ${height} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${progress.completed} of ${progress.total} completed (${value}%)`}
      aria-label={label}
    >
      <div
        className={`h-full rounded-sm bg-accent transition-[width] duration-200 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
