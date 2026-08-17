import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addUtcDays, utcTodayIsoDate } from "./dates";
import {
  EVIDENCE_DUE_SOON_DAYS,
  deriveEvidenceFreshness,
} from "./freshness";

describe("evidence freshness", () => {
  it("uses UTC calendar dates for today", () => {
    assert.equal(utcTodayIsoDate(new Date("2026-08-17T23:30:00.000Z")), "2026-08-17");
    assert.equal(utcTodayIsoDate(new Date("2026-08-18T00:00:00.000Z")), "2026-08-18");
  });

  it("adds day offsets across month boundaries", () => {
    assert.equal(addUtcDays("2026-01-15", 30), "2026-02-14");
    assert.equal(addUtcDays("2026-01-15", -1), "2026-01-14");
    assert.equal(addUtcDays("2024-02-28", 1), "2024-02-29");
    assert.equal(addUtcDays("not-a-date", 1), null);
  });

  it("returns no_review_date when review due date is null", () => {
    assert.equal(deriveEvidenceFreshness(null, "2026-06-01"), "no_review_date");
    assert.equal(deriveEvidenceFreshness("", "2026-06-01"), "no_review_date");
  });

  it("treats a due date before asOfDate as overdue", () => {
    assert.equal(deriveEvidenceFreshness("2026-05-31", "2026-06-01"), "overdue");
  });

  it("treats a due date exactly today as due soon", () => {
    assert.equal(deriveEvidenceFreshness("2026-06-01", "2026-06-01"), "due_soon");
  });

  it("includes the 30-day boundary in due soon", () => {
    const asOf = "2026-01-15";
    const end = addUtcDays(asOf, EVIDENCE_DUE_SOON_DAYS);
    assert.equal(end, "2026-02-14");
    assert.equal(deriveEvidenceFreshness(end, asOf), "due_soon");
    assert.equal(deriveEvidenceFreshness("2026-02-15", asOf), "current");
  });

  it("treats dates after the due-soon window as current", () => {
    assert.equal(deriveEvidenceFreshness("2026-12-31", "2026-06-01"), "current");
  });

  it("does not use collection date (caller must pass reviewDueDate only)", () => {
    assert.equal(deriveEvidenceFreshness("2020-01-01", "2026-06-01"), "overdue");
  });

  it("rejects an invalid asOfDate", () => {
    assert.throws(
      () => deriveEvidenceFreshness("2026-06-01", "06/01/2026"),
      /asOfDate/,
    );
  });
});
