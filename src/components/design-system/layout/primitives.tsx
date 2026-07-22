import type { ReactNode } from "react";

export type StackProps = {
  children: ReactNode;
  gap?: "sm" | "md" | "lg";
  className?: string;
};

const GAP: Record<NonNullable<StackProps["gap"]>, string> = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

/** Vertical stack with consistent gaps. */
export function Stack({ children, gap = "md", className = "" }: StackProps) {
  return (
    <div className={`flex flex-col ${GAP[gap]} ${className}`}>{children}</div>
  );
}

export type InlineProps = {
  children: ReactNode;
  gap?: "sm" | "md";
  wrap?: boolean;
  className?: string;
};

/** Horizontal inline cluster. */
export function Inline({
  children,
  gap = "sm",
  wrap = true,
  className = "",
}: InlineProps) {
  return (
    <div
      className={`flex items-center ${wrap ? "flex-wrap" : ""} ${
        gap === "sm" ? "gap-1.5" : "gap-2"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export type SplitLayoutProps = {
  main: ReactNode;
  side: ReactNode;
  className?: string;
};

/**
 * Responsive two-column layout: main ~70%, side ~30%; stacks on small screens.
 */
export function SplitLayout({ main, side, className = "" }: SplitLayoutProps) {
  return (
    <div
      className={`flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6 ${className}`}
    >
      <div className="min-w-0 flex-1 space-y-5 lg:basis-[70%]">{main}</div>
      <aside
        className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-4 lg:w-[min(100%,var(--layout-sidebar))] lg:basis-[30%] lg:self-start"
        aria-label="Control operations"
      >
        {side}
      </aside>
    </div>
  );
}

export type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  maxHeightClassName?: string;
};

export function ScrollArea({
  children,
  className = "",
  maxHeightClassName = "max-h-56",
}: ScrollAreaProps) {
  return (
    <div
      className={`${maxHeightClassName} overflow-y-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  );
}

export type SectionHeaderProps = {
  title: string;
  titleId?: string;
  description?: string;
  className?: string;
};

export function SectionHeader({
  title,
  titleId,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <h3
        id={titleId}
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-md border border-dashed border-border-strong bg-surface px-4 py-8 text-center ${className}`}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
