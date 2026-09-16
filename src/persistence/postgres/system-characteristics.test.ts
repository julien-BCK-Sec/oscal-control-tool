import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { afterEach, describe, it } from "node:test";
import { createProjectMetadata, DEFAULT_PROJECT_METADATA } from "@/data/project";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  buildStoredProjectDocumentV1,
  parseProjectDocumentJson,
  serializeProjectDocument,
} from "@/persistence/document";
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

const authoredCharacteristics = createProjectMetadata({
  systemName: "SGOP",
  organizationName: "Canadian Goose Defence System",
  systemDescription: "Overview",
  systemNameShort: "SGOP",
  systemIdentifier: "CGDS-SGOP-001",
  authorizationBoundary: "Mission Control SC-3 is inside.",
  environmentOfOperation: "Honkwater Barracks.",
  operationalStatus: "operational",
  securityCategorization: {
    confidentiality: "moderate",
    integrity: "moderate",
    availability: "moderate",
  },
  dodCloudImpactLevel: { level: "il4" },
  systemRoles: [
    { id: "role-owner", role: "system-owner", name: "Gary Mercer" },
  ],
  informationTypes: [{ id: "info-1", title: "Deployment orders" }],
  interconnections: [{ id: "conn-1", name: "Weather feed" }],
});

describe("project_json schema v2 system characteristics", () => {
  it("loads a pre-07A v1 document with metadata preserved and new fields empty", async () => {
    const { repo, db } = await tempRepo();
    const created = await repo.create({
      name: "Legacy",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Legacy System",
        organizationName: "Legacy Org",
        systemDescription: "Original overview",
      },
    });

    const v1 = buildStoredProjectDocumentV1({
      id: created.id,
      name: created.name,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Legacy System",
        organizationName: "Legacy Org",
        systemDescription: "Original overview",
      },
      implementations: {},
    });
    await db
      .update(projects)
      .set({
        projectJson: serializeProjectDocument(v1),
        schemaVersion: 1,
      })
      .where(eq(projects.id, created.id));

    const loaded = await repo.load(created.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.equal(loaded.project.metadata.systemName, "Legacy System");
    assert.equal(loaded.project.metadata.organizationName, "Legacy Org");
    assert.equal(loaded.project.metadata.systemDescription, "Original overview");
    assert.equal(loaded.project.metadata.authorizationBoundary, "");
    assert.equal(loaded.project.metadata.securityCategorization, null);
    assert.equal(loaded.project.metadata.dodCloudImpactLevel, null);
    assert.deepEqual(loaded.project.metadata.systemRoles, []);
    assert.equal(loaded.project.schemaVersion, 2);

    const rows = await db
      .select({ schemaVersion: projects.schemaVersion })
      .from(projects)
      .where(eq(projects.id, created.id));
    assert.equal(rows[0]?.schemaVersion, 1);
  });

  it("saves a valid v2 document and round-trips system characteristics", async () => {
    const { repo, db } = await tempRepo();
    const created = await repo.create({
      name: "SGOP",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: authoredCharacteristics,
    });
    assert.equal(created.schemaVersion, 2);
    assert.equal(
      created.metadata.authorizationBoundary,
      authoredCharacteristics.authorizationBoundary,
    );

    const loaded = await repo.load(created.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.deepEqual(loaded.project.metadata, authoredCharacteristics);

    const rows = await db
      .select({ projectJson: projects.projectJson })
      .from(projects)
      .where(eq(projects.id, created.id));
    const parsed = parseProjectDocumentJson(rows[0]?.projectJson ?? "");
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.document.schemaVersion, 2);
      assert.equal(
        parsed.document.project.metadata.systemIdentifier,
        "CGDS-SGOP-001",
      );
    }
  });

  it("preserves system characteristics in named versions and restore", async () => {
    const { repo } = await tempRepo();
    const created = await repo.create({
      name: "SGOP",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: authoredCharacteristics,
    });
    const named = await repo.createNamedVersion({
      projectId: created.id,
      name: "Checkpoint",
      expectedRevision: created.revision,
    });
    assert.equal(named.ok, true);
    if (!named.ok) {
      return;
    }
    const snapshot = await repo.getSnapshot(created.id, named.snapshot.id);
    assert.equal(snapshot?.document.schemaVersion, 2);
    assert.deepEqual(snapshot?.document.project.metadata, authoredCharacteristics);

    const cleared = await repo.save({
      id: created.id,
      name: created.name,
      metadata: DEFAULT_PROJECT_METADATA,
      implementations: {},
      expectedRevision: created.revision,
    });
    assert.equal(cleared.ok, true);
    if (!cleared.ok) {
      return;
    }
    assert.equal(cleared.project.metadata.authorizationBoundary, "");

    const restored = await repo.restoreSnapshot({
      projectId: created.id,
      snapshotId: named.snapshot.id,
      expectedRevision: cleared.project.revision,
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) {
      return;
    }
    assert.deepEqual(restored.project.metadata, authoredCharacteristics);
  });

  it("restoring a v1 snapshot yields empty new fields", async () => {
    const { repo, db } = await tempRepo();
    const created = await repo.create({
      name: "SGOP",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: authoredCharacteristics,
    });
    const named = await repo.createNamedVersion({
      projectId: created.id,
      name: "V1 era",
      expectedRevision: created.revision,
    });
    assert.equal(named.ok, true);
    if (!named.ok) {
      return;
    }

    const v1 = buildStoredProjectDocumentV1({
      id: created.id,
      name: created.name,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: {
        systemName: "Legacy name",
        organizationName: "Legacy org",
        systemDescription: "Legacy overview",
      },
      implementations: {},
    });
    await db
      .update(projectSnapshots)
      .set({ projectJson: serializeProjectDocument(v1) })
      .where(eq(projectSnapshots.id, named.snapshot.id));

    const restored = await repo.restoreSnapshot({
      projectId: created.id,
      snapshotId: named.snapshot.id,
      expectedRevision: created.revision,
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) {
      return;
    }
    assert.equal(restored.project.metadata.systemName, "Legacy name");
    assert.equal(restored.project.metadata.organizationName, "Legacy org");
    assert.equal(
      restored.project.metadata.systemDescription,
      "Legacy overview",
    );
    assert.equal(restored.project.metadata.authorizationBoundary, "");
    assert.equal(restored.project.metadata.securityCategorization, null);
    assert.equal(restored.project.metadata.dodCloudImpactLevel, null);
    assert.deepEqual(restored.project.metadata.systemRoles, []);
  });

  it("does not infer FIPS categorization or DoD IL from framework selection", async () => {
    const { repo } = await tempRepo();
    const moderate = await repo.create({
      name: "NIST Moderate",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const il4 = await repo.create({
      name: "IL4",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });
    assert.equal(moderate.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(il4.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(moderate.metadata.securityCategorization, null);
    assert.equal(moderate.metadata.dodCloudImpactLevel, null);
    assert.equal(il4.metadata.securityCategorization, null);
    assert.equal(il4.metadata.dodCloudImpactLevel, null);
    assert.equal(il4.metadata.organizationName, "");
    assert.deepEqual(il4.metadata.systemRoles, []);
  });
});
