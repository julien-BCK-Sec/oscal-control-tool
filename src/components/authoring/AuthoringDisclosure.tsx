"use client";

import { useId, useState, type ReactNode } from "react";
import {
  authoringDisclosurePanelId,
  authoringDisclosureToggleLabel,
} from "./disclosure";
import { preserveNativeControlKeys } from "@/editor/keyboard-target";

export type AuthoringDisclosureProps = {
  title: string;
  titleId?: string;
  summary?: string;
  description?: string;
  defaultOpen?: boolean;
  expandHint?: string;
  collapseHint?: string;
  children: ReactNode;
  className?: string;
  /** Compact row disclosure: chevron + title only, no trailing Show/Hide. */
  compact?: boolean;
};

/**
 * Keyboard-accessible progressive disclosure for authoring sections.
 * Open/closed state is local UI only and does not persist project data.
 * Uses a native button so Space/Enter follow ordinary activation.
 * Children stay mounted while collapsed so live drafts are not reset.
 */
export function AuthoringDisclosure({
  title,
  titleId,
  summary,
  description,
  defaultOpen = false,
  expandHint = "Show",
  collapseHint = "Hide",
  children,
  className = "",
  compact = false,
}: AuthoringDisclosureProps) {
  const generatedId = useId();
  const headingId = titleId ?? generatedId;
  const panelId = authoringDisclosurePanelId(headingId);
  const [expanded, setExpanded] = useState(defaultOpen);
  const hint = authoringDisclosureToggleLabel(
    expanded,
    expandHint,
    collapseHint,
  );

  return (
    <section aria-labelledby={headingId} className={`min-w-0 ${className}`.trim()}>
      <button
        type="button"
        id={headingId}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={preserveNativeControlKeys}
        className={
          compact
            ? "group flex w-full items-center gap-1.5 rounded-sm py-0.5 text-left text-xs text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            : "group flex w-full items-start gap-2 rounded-sm py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        }
      >
        <span
          aria-hidden="true"
          className={
            compact
              ? "text-[10px] text-text-muted group-hover:text-text-secondary"
              : "mt-0.5 text-[10px] text-text-muted group-hover:text-text-secondary"
          }
        >
          {expanded ? "▼" : "▶"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={
                compact
                  ? "text-xs font-medium text-text-secondary"
                  : "text-sm font-semibold tracking-tight text-foreground"
              }
            >
              {title}
            </span>
            {summary ? (
              <span className="text-xs text-text-secondary">{summary}</span>
            ) : null}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
              {description}
            </span>
          ) : null}
        </span>
        {compact ? null : (
          <span className="shrink-0 text-xs text-text-muted">{hint}</span>
        )}
      </button>
      <div id={panelId} hidden={!expanded} className={expanded ? "mt-2" : undefined}>
        {children}
      </div>
    </section>
  );
}
