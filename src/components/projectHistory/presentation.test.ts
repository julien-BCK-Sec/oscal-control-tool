import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProjectSnapshotSummary } from "@/persistence/types";
import {
  formatProjectRevisionLabel,
  formatSnapshotHistorySecondary,
  formatSnapshotHistoryTitle,
  isRestorableSnapshot,
  partitionSnapshotsForHistory,
} from "./presentation";

function snapshot(
  partial: Partial<ProjectSnapshotSummary> &
    Pick<ProjectSnapshotSummary, "id" | "snapshotType">,
): ProjectSnapshotSummary {
  return {
    projectId: partial.projectId ?? "project-a",
    name: partial.name ?? null,
    projectRevision: partial.projectRevision ?? 1,
    createdAt: partial.createdAt ?? "2026-07-21T12:00:00.000Z",
    ...partial,
  };
}

describe("project history presentation", () => {
  it("labels project revision distinctly from named versions", () => {
    assert.equal(formatProjectRevisionLabel(10), "Project revision 10");
    assert.equal(
      formatSnapshotHistorySecondary({ projectRevision: 10 }),
      "Project revision 10",
    );
  });

  it("titles named versions, automatic snapshots, and recovery entries", () => {
    assert.equal(
      formatSnapshotHistoryTitle({
        snapshotType: "named",
        name: "Management Review",
      }),
      "Management Review",
    );
    assert.equal(
      formatSnapshotHistoryTitle({ snapshotType: "automatic", name: null }),
      "Automatic snapshot",
    );
    assert.equal(
      formatSnapshotHistoryTitle({ snapshotType: "pre-restore", name: null }),
      "Recovery snapshot",
    );
  });

  it("marks all snapshot kinds as restorable in the UI model", () => {
    assert.equal(isRestorableSnapshot({ snapshotType: "named" }), true);
    assert.equal(isRestorableSnapshot({ snapshotType: "automatic" }), true);
    assert.equal(isRestorableSnapshot({ snapshotType: "pre-restore" }), true);
  });

  it("partitions snapshots without mixing projects when caller scopes the list", () => {
    const projectA = [
      snapshot({
        id: "n1",
        snapshotType: "named",
        name: "Draft",
        projectId: "a",
        projectRevision: 2,
      }),
      snapshot({
        id: "a1",
        snapshotType: "automatic",
        projectId: "a",
        projectRevision: 3,
      }),
      snapshot({
        id: "r1",
        snapshotType: "pre-restore",
        projectId: "a",
        projectRevision: 3,
      }),
    ];
    const partitioned = partitionSnapshotsForHistory(projectA);
    assert.equal(partitioned.namedVersions.length, 1);
    assert.equal(partitioned.automaticSnapshots.length, 1);
    assert.equal(partitioned.recoverySnapshots.length, 1);
    assert.ok(
      partitioned.namedVersions.every((row) => row.projectId === "a"),
    );
    assert.ok(
      partitioned.automaticSnapshots.every((row) => row.projectId === "a"),
    );
  });

  it("does not treat project revision as a named-version sequence label", () => {
    const title = formatSnapshotHistoryTitle({
      snapshotType: "named",
      name: "Ready for Audit",
    });
    const secondary = formatSnapshotHistorySecondary({ projectRevision: 8 });
    assert.equal(title, "Ready for Audit");
    assert.match(secondary, /^Project revision /);
    assert.doesNotMatch(title, /^rev\s*\d+/i);
    assert.doesNotMatch(title, /^Project revision/);
  });
});
