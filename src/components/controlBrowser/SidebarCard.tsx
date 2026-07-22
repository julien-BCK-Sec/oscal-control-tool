import type { ReactNode } from "react";

export type SidebarCardProps = {
  title: string;
  titleId: string;
  children: ReactNode;
  /** Emphasize the card (e.g. Review workflow). */
  prominent?: boolean;
  className?: string;
};

/**
 * Operational property panel card for the control editor sidebar.
 */
export function SidebarCard({
  title,
  titleId,
  children,
  prominent = false,
  className = "",
}: SidebarCardProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-md px-3.5 py-3.5 ${
        prominent
          ? "bg-accent-muted/50 ring-1 ring-accent/20"
          : "bg-surface-secondary/80"
      } ${className}`}
    >
      <h3
        id={titleId}
        className="text-[11px] font-semibold uppercase tracking-wider text-text-muted"
      >
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
