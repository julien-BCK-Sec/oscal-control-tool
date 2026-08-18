"use client";

import { useSyncExternalStore } from "react";
import {
  formatAbsoluteTimestamp,
  timestampDateTimeAttr,
} from "@/components/time/formatAbsoluteTimestamp";

export type AbsoluteTimestampProps = {
  value: string;
  className?: string;
};

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Renders a semantic <time> whose SSR/hydration HTML is deterministic (UTC,
 * en-US). After hydration, useSyncExternalStore switches to the user's locale
 * and timezone without a hydration mismatch.
 */
export function AbsoluteTimestamp({ value, className }: AbsoluteTimestampProps) {
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const dateTime = timestampDateTimeAttr(value);
  const label = formatAbsoluteTimestamp(value, isClient ? "local" : "utc");

  if (!dateTime) {
    return <span className={className}>{value}</span>;
  }

  return (
    <time dateTime={dateTime} className={className}>
      {label}
    </time>
  );
}
