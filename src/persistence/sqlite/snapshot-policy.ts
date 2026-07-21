/**
 * Pure snapshot policy helpers — no database access.
 * Automatic snapshots are throttled and pruned; named versions are never pruned.
 */

import {
  AUTOMATIC_SNAPSHOT_INTERVAL_MS,
  AUTOMATIC_SNAPSHOT_RETENTION,
  PRE_RESTORE_SNAPSHOT_RETENTION,
} from "../constants";
import type { SnapshotType } from "../types";

export type SnapshotPolicyRow = {
  id: string;
  snapshotType: SnapshotType;
  contentFingerprint: string;
  createdAt: string;
};

export function shouldCreateAutomaticSnapshot(input: {
  nowMs: number;
  contentFingerprint: string;
  existingAutomatic: SnapshotPolicyRow[];
}): boolean {
  const { nowMs, contentFingerprint, existingAutomatic } = input;
  if (existingAutomatic.length === 0) {
    return true;
  }

  const newest = [...existingAutomatic].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

  if (newest.contentFingerprint === contentFingerprint) {
    return false;
  }

  const newestMs = Date.parse(newest.createdAt);
  if (Number.isNaN(newestMs)) {
    return true;
  }

  return nowMs - newestMs >= AUTOMATIC_SNAPSHOT_INTERVAL_MS;
}

/**
 * Returns snapshot ids that should be deleted to enforce retention.
 * Named versions are never included.
 */
export function snapshotIdsToPrune(input: {
  snapshots: SnapshotPolicyRow[];
  automaticRetention?: number;
  preRestoreRetention?: number;
}): string[] {
  const automaticRetention =
    input.automaticRetention ?? AUTOMATIC_SNAPSHOT_RETENTION;
  const preRestoreRetention =
    input.preRestoreRetention ?? PRE_RESTORE_SNAPSHOT_RETENTION;

  const toDelete: string[] = [];

  const byType = (type: SnapshotType) =>
    input.snapshots
      .filter((row) => row.snapshotType === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const automatic = byType("automatic");
  if (automatic.length > automaticRetention) {
    for (const row of automatic.slice(automaticRetention)) {
      toDelete.push(row.id);
    }
  }

  const preRestore = byType("pre-restore");
  if (preRestore.length > preRestoreRetention) {
    for (const row of preRestore.slice(preRestoreRetention)) {
      toDelete.push(row.id);
    }
  }

  return toDelete;
}
