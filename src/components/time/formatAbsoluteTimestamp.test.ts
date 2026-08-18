import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAbsoluteTimestamp,
  timestampDateTimeAttr,
} from "./formatAbsoluteTimestamp";

describe("formatAbsoluteTimestamp", () => {
  it("formats UTC timestamps deterministically regardless of default locale", () => {
    const iso = "2026-08-18T20:15:48.000Z";
    const formatted = formatAbsoluteTimestamp(iso, "utc");
    const expected = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(new Date(iso));

    assert.equal(formatted, expected);
    assert.match(formatted, /UTC/);
    assert.doesNotMatch(formatted, /p\.m\./i);
  });

  it("returns the original string when the value is not a date", () => {
    assert.equal(formatAbsoluteTimestamp("yesterday", "utc"), "yesterday");
    assert.equal(timestampDateTimeAttr("yesterday"), undefined);
  });

  it("exposes an ISO dateTime attribute for valid timestamps", () => {
    assert.equal(
      timestampDateTimeAttr("2026-08-18T20:15:48.000Z"),
      "2026-08-18T20:15:48.000Z",
    );
  });

  it("formats local timestamps without requiring a timezone name suffix", () => {
    const formatted = formatAbsoluteTimestamp("2026-08-18T20:15:48.000Z", "local");
    assert.match(formatted, /2026/);
    assert.doesNotMatch(formatted, /UTC/);
  });
});
