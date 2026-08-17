/**
 * Derived Evidence freshness (Milestone 03D).
 * Never persisted. Never mutates Evidence lifecycle status.
 */

import { addUtcDays } from "./dates";
import { parseEvidenceDate } from "./validation";

/** Inclusive window for "due soon" relative to `asOfDate`. */
export const EVIDENCE_DUE_SOON_DAYS = 30;

export const EVIDENCE_FRESHNESS_STATES = [
  "current",
  "due_soon",
  "overdue",
  "no_review_date",
] as const;

export type EvidenceFreshness = (typeof EVIDENCE_FRESHNESS_STATES)[number];

export const EVIDENCE_FRESHNESS_LABELS: Record<EvidenceFreshness, string> = {
  current: "Current",
  due_soon: "Due soon",
  overdue: "Overdue",
  no_review_date: "No review date",
};

export function isEvidenceFreshness(
  value: unknown,
): value is EvidenceFreshness {
  return (
    typeof value === "string" &&
    (EVIDENCE_FRESHNESS_STATES as readonly string[]).includes(value)
  );
}

export function evidenceFreshnessLabel(state: EvidenceFreshness): string {
  return EVIDENCE_FRESHNESS_LABELS[state];
}

/**
 * Derive freshness from `reviewDueDate` only.
 * `collectionDate` is inventory metadata and must not be passed here.
 *
 * - overdue: reviewDueDate < asOfDate
 * - due_soon: asOfDate <= reviewDueDate <= asOfDate + 30 days (inclusive)
 * - current: reviewDueDate > asOfDate + 30 days
 * - no_review_date: null / empty review due date
 */
export function deriveEvidenceFreshness(
  reviewDueDate: string | null | undefined,
  asOfDate: string,
): EvidenceFreshness {
  const asOf = parseEvidenceDate(asOfDate);
  if (asOf === null || asOf === undefined) {
    throw new Error("asOfDate must be a valid YYYY-MM-DD calendar date.");
  }
  const due = parseEvidenceDate(reviewDueDate ?? null);
  if (due === undefined) {
    throw new Error("reviewDueDate must be a valid YYYY-MM-DD calendar date.");
  }
  if (due === null) {
    return "no_review_date";
  }
  if (due < asOf) {
    return "overdue";
  }
  const dueSoonEnd = addUtcDays(asOf, EVIDENCE_DUE_SOON_DAYS);
  if (dueSoonEnd === null) {
    throw new Error("Failed to compute due-soon window.");
  }
  if (due <= dueSoonEnd) {
    return "due_soon";
  }
  return "current";
}
