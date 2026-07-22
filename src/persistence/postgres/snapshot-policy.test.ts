import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldCreateAutomaticSnapshot,
  snapshotIdsToPrune,
} from "./snapshot-policy";

describe("snapshot policy", () => {
  it("allows first automatic snapshot", () => {
    assert.equal(
      shouldCreateAutomaticSnapshot({
        nowMs: 1_000_000,
        contentFingerprint: "a",
        existingAutomatic: [],
      }),
      true,
    );
  });

  it("skips identical content", () => {
    assert.equal(
      shouldCreateAutomaticSnapshot({
        nowMs: 1_000_000,
        contentFingerprint: "a",
        existingAutomatic: [
          {
            id: "1",
            snapshotType: "automatic",
            contentFingerprint: "a",
            createdAt: new Date(0).toISOString(),
          },
        ],
      }),
      false,
    );
  });

  it("throttles within five minutes", () => {
    const now = Date.parse("2026-07-21T12:00:00.000Z");
    assert.equal(
      shouldCreateAutomaticSnapshot({
        nowMs: now,
        contentFingerprint: "b",
        existingAutomatic: [
          {
            id: "1",
            snapshotType: "automatic",
            contentFingerprint: "a",
            createdAt: new Date(now - 60_000).toISOString(),
          },
        ],
      }),
      false,
    );
  });

  it("allows after five minutes with changed content", () => {
    const now = Date.parse("2026-07-21T12:00:00.000Z");
    assert.equal(
      shouldCreateAutomaticSnapshot({
        nowMs: now,
        contentFingerprint: "b",
        existingAutomatic: [
          {
            id: "1",
            snapshotType: "automatic",
            contentFingerprint: "a",
            createdAt: new Date(now - 6 * 60_000).toISOString(),
          },
        ],
      }),
      true,
    );
  });

  it("prunes automatic and pre-restore but never named", () => {
    const snapshots = [
      ...Array.from({ length: 32 }, (_, i) => ({
        id: `a${i}`,
        snapshotType: "automatic" as const,
        contentFingerprint: `f${i}`,
        createdAt: new Date(i).toISOString(),
      })),
      {
        id: "named",
        snapshotType: "named" as const,
        contentFingerprint: "n",
        createdAt: new Date(1000).toISOString(),
      },
      ...Array.from({ length: 25 }, (_, i) => ({
        id: `p${i}`,
        snapshotType: "pre-restore" as const,
        contentFingerprint: `p${i}`,
        createdAt: new Date(i).toISOString(),
      })),
    ];

    const deleted = snapshotIdsToPrune({
      snapshots,
      automaticRetention: 30,
      preRestoreRetention: 20,
    });

    assert.ok(deleted.length >= 2);
    assert.ok(!deleted.includes("named"));
    assert.equal(
      snapshots.filter((s) => s.snapshotType === "automatic").length -
        deleted.filter((id) => id.startsWith("a")).length,
      30,
    );
  });
});
