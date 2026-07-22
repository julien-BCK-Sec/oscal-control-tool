import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createTestProjectRepository } from "@/persistence/postgres/testing";
import { projectSnapshots, projects } from "@/persistence/postgres/schema";

async function tempRepo() {
  const db = await openTestDb();
  return { repo: createTestProjectRepository(db), db };
}

afterEach(async () => {
  await closeDb();
});

describe("ProjectRepository", () => {
  it("creates, lists, loads, renames, saves, and deletes", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "Alpha",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Alpha",
        organizationName: "Org",
        systemDescription: "Desc",
      },
      implementations: {
        "ac-1": { status: "in-progress", narrative: "policy" },
      },
    });

    assert.equal(created.revision, 1);
    assert.equal(created.implementations["ac-1"]?.narrative, "policy");

    const listed = await repo.list();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].name, "Alpha");
    assert.equal(listed[0].organizationName, "Org");

    const loaded = await repo.load(created.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.equal(loaded.project.implementations["ac-1"]?.status, "in-progress");

    const renamed = await repo.rename(created.id, "Alpha Renamed");
    assert.ok(renamed);
    assert.equal(renamed.name, "Alpha Renamed");
    assert.equal(renamed.revision, 2);

    const saved = await repo.save({
      id: created.id,
      name: "Alpha Renamed",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: renamed.metadata,
      implementations: {
        "ac-1": { status: "implemented", narrative: "done" },
        "ac-2": { status: "not-started", narrative: "" },
      },
      expectedRevision: renamed.revision,
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    assert.equal(saved.project.revision, 3);
    assert.equal(saved.project.implementations["ac-1"]?.status, "implemented");

    await repo.delete(created.id);
    const afterDelete = await repo.load(created.id);
    assert.equal(afterDelete.ok, false);
  });

  it("rejects conflicting revisions", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "Conflict",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const first = await repo.save({
      id: created.id,
      name: "Conflict",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: created.metadata,
      implementations: { "ac-1": { status: "implemented", narrative: "a" } },
      expectedRevision: 1,
    });
    assert.equal(first.ok, true);

    const conflict = await repo.save({
      id: created.id,
      name: "Conflict",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: created.metadata,
      implementations: { "ac-1": { status: "implemented", narrative: "stale" } },
      expectedRevision: 1,
    });
    assert.equal(conflict.ok, false);
    if (conflict.ok) {
      return;
    }
    assert.equal(conflict.reason, "conflict");
    assert.equal(conflict.currentRevision, 2);

    const loaded = await repo.load(created.id);
    assert.ok(loaded.ok);
    if (!loaded.ok) {
      return;
    }
    assert.equal(loaded.project.implementations["ac-1"]?.narrative, "a");
  });

  it("rejects invalid saves", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "Valid",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const emptyName = await repo.save({
      id: created.id,
      name: "   ",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: created.metadata,
      implementations: {},
      expectedRevision: 1,
    });
    assert.equal(emptyName.ok, false);
    if (!emptyName.ok) {
      assert.equal(emptyName.reason, "validation");
    }
  });

  it("reports corrupt project_json without overwriting", async () => {
    const { repo, db } = await tempRepo();
    const created = await repo.create({
      name: "CorruptMe",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await db
      .update(projects)
      .set({ projectJson: "{not-json" })
      .where(eq(projects.id, created.id));

    const loaded = await repo.load(created.id);
    assert.equal(loaded.ok, false);
    if (!loaded.ok) {
      assert.equal(loaded.error.kind, "corrupt");
    }
  });
});

describe("snapshots and versions", () => {
  it("creates named versions that are not pruned", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "Versions",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "implemented", narrative: "n" },
      },
    });

    const named = await repo.createNamedVersion({
      projectId: created.id,
      name: "Initial Draft",
      expectedRevision: 1,
    });
    assert.equal(named.ok, true);
    if (!named.ok) {
      return;
    }
    assert.equal(named.snapshot.snapshotType, "named");

    for (let i = 0; i < 35; i++) {
      const saved = await repo.save({
        id: created.id,
        name: created.name,
        frameworkId: NIST_MODERATE_FRAMEWORK_ID,
        metadata: created.metadata,
        implementations: {
          "ac-1": { status: "implemented", narrative: `n-${i}` },
        },
        expectedRevision: 1 + i,
      });
      assert.ok(saved.ok);
      await repo.createAutomaticSnapshotNow(created.id);
    }

    const snapshots = await repo.listSnapshots(created.id);
    const namedLeft = snapshots.filter((s) => s.snapshotType === "named");
    const automatic = snapshots.filter((s) => s.snapshotType === "automatic");
    assert.equal(namedLeft.length, 1);
    assert.ok(automatic.length <= 30);
  });

  it("dedupes automatic snapshots with identical content", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "Dedupe",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const first = await repo.createAutomaticSnapshotNow(created.id);
    assert.ok(first);
    const second = await repo.createAutomaticSnapshotNow(created.id);
    assert.equal(second, null);
  });

  it("restores a snapshot and creates a pre-restore safety copy", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "Restore",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "not-started", narrative: "before" },
      },
    });

    const version = await repo.createNamedVersion({
      projectId: created.id,
      name: "Checkpoint",
      expectedRevision: 1,
    });
    assert.ok(version.ok);
    if (!version.ok) {
      return;
    }

    const saved = await repo.save({
      id: created.id,
      name: "Restore",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: created.metadata,
      implementations: {
        "ac-1": { status: "implemented", narrative: "after" },
      },
      expectedRevision: 1,
    });
    assert.ok(saved.ok);
    if (!saved.ok) {
      return;
    }

    const restored = await repo.restoreSnapshot({
      projectId: created.id,
      snapshotId: version.snapshot.id,
      expectedRevision: saved.project.revision,
    });
    assert.ok(restored.ok);
    if (!restored.ok) {
      return;
    }
    assert.equal(restored.project.implementations["ac-1"]?.narrative, "before");
    assert.ok(restored.project.revision > saved.project.revision);

    const snapshots = await repo.listSnapshots(created.id);
    const pre = snapshots.find((s) => s.id === restored.preRestoreSnapshotId);
    assert.ok(pre);
    assert.equal(pre.snapshotType, "pre-restore");

    const preFull = await repo.getSnapshot(
      created.id,
      restored.preRestoreSnapshotId,
    );
    assert.ok(preFull);
    assert.equal(
      preFull.document.project.implementations["ac-1"]?.narrative,
      "after",
    );
  });

  it("throttles automatic snapshots when respectThrottle is true", async () => {
    const { repo, db } = await tempRepo();
    const created = await repo.create({
      name: "Throttle",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const first = await repo.createAutomaticSnapshot(created.id);
    assert.ok(first);

    const saved = await repo.save({
      id: created.id,
      name: "Throttle",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        ...created.metadata,
        systemDescription: "changed",
      },
      implementations: {},
      expectedRevision: 1,
    });
    assert.ok(saved.ok);

    const throttled = await repo.createAutomaticSnapshot(created.id);
    assert.equal(throttled, null);

    await db
      .update(projectSnapshots)
      .set({
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      })
      .where(eq(projectSnapshots.id, first!.id));

    const allowed = await repo.createAutomaticSnapshot(created.id);
    assert.ok(allowed);
  });

  it("restores an automatic snapshot and keeps history scoped per project", async () => {
    const { repo } = await tempRepo();
    const projectA = await repo.create({
      name: "Project A",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "implemented", narrative: "a-original" },
      },
    });
    const projectB = await repo.create({
      name: "Project B",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "implemented", narrative: "b-only" },
      },
    });

    const autoA = await repo.createAutomaticSnapshotNow(projectA.id);
    assert.ok(autoA);
    assert.equal(autoA.snapshotType, "automatic");

    await repo.createNamedVersion({
      projectId: projectB.id,
      name: "B Milestone",
      expectedRevision: 1,
    });

    const savedA = await repo.save({
      id: projectA.id,
      name: projectA.name,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: projectA.metadata,
      implementations: {
        "ac-1": { status: "implemented", narrative: "a-changed" },
      },
      expectedRevision: 1,
    });
    assert.ok(savedA.ok);
    if (!savedA.ok || !autoA) {
      return;
    }

    const restored = await repo.restoreSnapshot({
      projectId: projectA.id,
      snapshotId: autoA.id,
      expectedRevision: savedA.project.revision,
    });
    assert.ok(restored.ok);
    if (!restored.ok) {
      return;
    }
    assert.equal(
      restored.project.implementations["ac-1"]?.narrative,
      "a-original",
    );

    const listA = await repo.listSnapshots(projectA.id);
    const listB = await repo.listSnapshots(projectB.id);
    assert.ok(listA.every((row) => row.projectId === projectA.id));
    assert.ok(listB.every((row) => row.projectId === projectB.id));
    assert.ok(listA.some((row) => row.snapshotType === "automatic"));
    assert.ok(listA.some((row) => row.snapshotType === "pre-restore"));
    assert.ok(listB.some((row) => row.name === "B Milestone"));
    assert.equal(
      listB.some((row) => row.id === autoA.id),
      false,
    );
  });
});
