"use client";

import {
  useRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CONTROL_NAV_WIDTH_MAX,
  CONTROL_NAV_WIDTH_MIN,
  nextControlNavWidthFromKey,
} from "./navWidth";

export type ControlNavResizeHandleProps = {
  paneId: string;
  width: number;
  onPreview: (next: number, containerWidth: number | null) => void;
  onCommit: (next: number, containerWidth: number | null) => void;
  getContainerWidth: () => number | null;
};

/**
 * Accessible vertical splitter between the control list and the editor.
 * Hidden below the `md` breakpoint so stacked mobile layout is unchanged.
 */
export function ControlNavResizeHandle({
  paneId,
  width,
  onPreview,
  onCommit,
  getContainerWidth,
}: ControlNavResizeHandleProps) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  function containerWidth(): number | null {
    return getContainerWidth();
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startWidth: width };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const delta = event.clientX - drag.startX;
    onPreview(drag.startWidth + delta, containerWidth());
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }
    const delta = event.clientX - dragRef.current.startX;
    const next = dragRef.current.startWidth + delta;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit(next, containerWidth());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextControlNavWidthFromKey(
      event.key,
      width,
      containerWidth(),
    );
    if (next == null) {
      return;
    }
    event.preventDefault();
    onCommit(next, containerWidth());
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-controls={paneId}
      aria-valuemin={CONTROL_NAV_WIDTH_MIN}
      aria-valuemax={CONTROL_NAV_WIDTH_MAX}
      aria-valuenow={width}
      aria-label="Resize control navigation"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className="group relative z-10 hidden w-3 shrink-0 cursor-col-resize touch-none items-stretch justify-center md:flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
    >
      <span
        aria-hidden="true"
        className="w-px self-stretch bg-border transition-[width,background-color] duration-[var(--transition-fast)] group-hover:w-0.5 group-hover:bg-accent group-focus-visible:w-0.5 group-focus-visible:bg-accent"
      />
    </div>
  );
}
