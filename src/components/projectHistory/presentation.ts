import type { ProjectSnapshotSummary, SnapshotType } from "@/persistence/types";

/** Label for the live project's optimistic-concurrency revision (not a version number). */
export function formatProjectRevisionLabel(revision: number): string {
  return `Project revision ${revision}`;
}

/**
 * Primary title for a history row.
 * Named versions use their user-provided name; automatic snapshots are explicit.
 */
export function formatSnapshotHistoryTitle(
  snapshot: Pick<ProjectSnapshotSummary, "snapshotType" | "name">,
): string {
  switch (snapshot.snapshotType) {
    case "named": {
      const name = snapshot.name?.trim();
      return name && name.length > 0 ? name : "Named version";
    }
    case "automatic":
      return "Automatic snapshot";
    case "pre-restore": {
      const name = snapshot.name?.trim();
      return name && name.length > 0 ? name : "Recovery snapshot";
    }
  }
}

/** Secondary line: ties the entry to the project revision at capture time. */
export function formatSnapshotHistorySecondary(
  snapshot: Pick<ProjectSnapshotSummary, "projectRevision">,
): string {
  return formatProjectRevisionLabel(snapshot.projectRevision);
}

export function formatSnapshotTimestamp(createdAt: string): string {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) {
    return createdAt;
  }
  return new Date(parsed).toLocaleString();
}

export type PartitionedSnapshots = {
  namedVersions: ProjectSnapshotSummary[];
  automaticSnapshots: ProjectSnapshotSummary[];
  recoverySnapshots: ProjectSnapshotSummary[];
};

/** Split snapshots for UI sections. Entries stay project-scoped by caller filtering. */
export function partitionSnapshotsForHistory(
  snapshots: readonly ProjectSnapshotSummary[],
): PartitionedSnapshots {
  const namedVersions: ProjectSnapshotSummary[] = [];
  const automaticSnapshots: ProjectSnapshotSummary[] = [];
  const recoverySnapshots: ProjectSnapshotSummary[] = [];

  for (const snapshot of snapshots) {
    switch (snapshot.snapshotType as SnapshotType) {
      case "named":
        namedVersions.push(snapshot);
        break;
      case "automatic":
        automaticSnapshots.push(snapshot);
        break;
      case "pre-restore":
        recoverySnapshots.push(snapshot);
        break;
      default:
        break;
    }
  }

  return { namedVersions, automaticSnapshots, recoverySnapshots };
}

/** True when the UI should offer Restore for this entry. */
export function isRestorableSnapshot(
  snapshot: Pick<ProjectSnapshotSummary, "snapshotType">,
): boolean {
  return (
    snapshot.snapshotType === "named" ||
    snapshot.snapshotType === "automatic" ||
    snapshot.snapshotType === "pre-restore"
  );
}
