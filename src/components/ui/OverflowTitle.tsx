"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { isTextOverflowing, overflowTooltipText } from "./overflowTitle";

export type OverflowTitleProps = {
  children: string;
  className?: string;
};

type TooltipCoords = {
  top: number;
  left: number;
  maxWidth: number;
};

function tooltipCoordsFor(el: HTMLElement): TooltipCoords {
  const rect = el.getBoundingClientRect();
  const maxWidth = Math.min(Math.max(rect.width, 16 * 16), 24 * 16);
  const left = Math.min(
    Math.max(8, rect.left),
    Math.max(8, window.innerWidth - maxWidth - 8),
  );
  const below = rect.bottom + 6;
  const estimatedHeight = 72;
  const top =
    below + estimatedHeight > window.innerHeight
      ? Math.max(8, rect.top - estimatedHeight)
      : below;
  return { top, left, maxWidth };
}

/**
 * Truncated text that reveals the full string on hover or keyboard focus
 * of the nearest button — only when the visible label actually overflows.
 */
export function OverflowTitle({ children, className = "" }: OverflowTitleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return false;
    }
    return isTextOverflowing(el);
  }, []);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const isTruncated = measure();
    setTruncated(isTruncated);
    if (!isTruncated) {
      setOpen(false);
      return;
    }
    setCoords(tooltipCoordsFor(el));
    setOpen(true);
  }, [measure]);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      setTruncated(measure());
    });
    observer.observe(el);
    setTruncated(measure());
    return () => observer.disconnect();
  }, [children, measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const button = el.closest("button");
    if (!button) {
      return;
    }
    const onFocus = () => {
      if (button.matches(":focus-visible")) {
        show();
      }
    };
    const onBlur = () => hide();
    button.addEventListener("focus", onFocus);
    button.addEventListener("blur", onBlur);
    return () => {
      button.removeEventListener("focus", onFocus);
      button.removeEventListener("blur", onBlur);
    };
  }, [hide, show]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDismiss() {
      hide();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        hide();
      }
    }
    window.addEventListener("scroll", onDismiss, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onDismiss, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hide, open]);

  const tooltipText = overflowTooltipText(children, truncated);
  const tooltipStyle: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
        maxWidth: coords.maxWidth,
      }
    : undefined;

  return (
    <>
      <span
        ref={ref}
        className={`min-w-0 ${className}`.trim()}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {open && tooltipText && coords && typeof document !== "undefined"
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              aria-hidden="true"
              className="pointer-events-none fixed z-50 break-words rounded-sm border border-border bg-surface px-2 py-1.5 text-[13px] font-medium leading-snug text-foreground shadow-elevated"
              style={tooltipStyle}
            >
              {tooltipText}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
