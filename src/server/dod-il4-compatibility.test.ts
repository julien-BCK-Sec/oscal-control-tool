import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { afterEach, describe, it } from "node:test";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { resolveFrameworkControls } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import {
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { serializeProjectDocument } from "@/persistence/document";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { projectSnapshots } from "@/persistence/postgres/schema";
import {
  createEvidenceForOrg,
  listEvidenceForOrg,
} from "@/server/authorized-evidence";
import {
  createNamedVersionForOrg,
  createProjectForOrg,
  getSnapshotForOrg,
  loadProjectForOrg,
  restoreSnapshotForOrg,
  saveProjectForOrg,
} from "@/server/authorized-projects";
import { UNKNOWN_FRAMEWORK_CONTROL_MESSAGE } from "@/server/project-control-identity";

afterEach(async () => {
  await closeDb();
});

function ctx(
  organizationId: string,
  role: OrgRole = "organization_admin",
): OrgContext {
  return { userId: "u-admin", organizationId, role };
}

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({
    name: "Compat Org",
    slug: "compat-org",
  });
  const evidence = createPostgresEvidenceService(db);
  return { db, projects, org, evidence, admin: ctx(org.id) };
}

describe("DoD IL4 export/compatibility", () => {
  it("loads and saves an IL4 project without changing framework identity", async () => {
    const { projects, evidence, admin } = await setup();
    const created = await createProjectForOrg(projects, admin, {
      name: "IL4 Compat",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
      metadata: {
        systemName: "IL4 System",
        organizationName: "Org",
        systemDescription: "Compatibility",
      },
      implementations: {
        "ac-2": { status: "in-progress", narrative: "Account reviews" },
        "grr-1": { status: "not-started", narrative: "PKI questionnaire" },
      },
    });
    assert.equal(created.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(resolveFrameworkControls(created.frameworkId).length, 345);

    const loaded = await loadProjectForOrg(projects, admin, created.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    assert.equal(loaded.project.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(loaded.project.implementations["grr-1"]?.narrative, "PKI questionnaire");
    assert.equal(
      JSON.stringify(loaded.project).includes("authoritative-value-required"),
      false,
    );

    const saved = await saveProjectForOrg(projects, admin, {
      id: created.id,
      name: "IL4 Compat saved",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: loaded.project.metadata,
      implementations: {
        "ac-2": { status: "implemented", narrative: "Updated reviews" },
        "grr-1": { status: "in-progress", narrative: "Still PKI" },
      },
      expectedRevision: loaded.project.revision,
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }
    assert.equal(saved.project.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(saved.project.name, "IL4 Compat saved");
    assert.equal(saved.project.implementations["ac-2"]?.status, "implemented");

    const rejected = await saveProjectForOrg(projects, admin, {
      id: created.id,
      name: created.name,
      metadata: saved.project.metadata,
      implementations: {
        "AC.L2-3.1.1": { status: "not-started", narrative: "nope" },
      },
      expectedRevision: saved.project.revision,
    });
    assert.equal(rejected.ok, false);
    if (!rejected.ok) {
      assert.equal(rejected.reason, "validation");
      assert.equal(rejected.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }

    const linked = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: created.id,
        title: "Account procedure",
        evidenceType: "policy",
        status: "active",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(linked.ok, true);
    const reloaded = await loadProjectForOrg(projects, admin, created.id);
    assert.equal(reloaded.ok, true);
    if (!reloaded.ok) {
      return;
    }
    assert.equal(reloaded.project.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    const remaining = await listEvidenceForOrg(
      projects,
      evidence,
      admin,
      created.id,
      { controlId: "ac-2" },
    );
    assert.equal(remaining.length, 1);
  });

  it("creates and restores IL4 named versions without switching framework identity", async () => {
    const { db, projects, admin } = await setup();
    const created = await createProjectForOrg(projects, admin, {
      name: "IL4 Versioned",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
      implementations: {
        "ac-2": { status: "not-started", narrative: "before" },
        "grr-10": { status: "not-started", narrative: "grr before" },
      },
    });
    const named = await createNamedVersionForOrg(projects, admin, {
      projectId: created.id,
      name: "IL4 checkpoint",
      expectedRevision: created.revision,
    });
    assert.equal(named.ok, true);
    if (!named.ok) {
      return;
    }
    const snapshot = await getSnapshotForOrg(
      projects,
      admin,
      created.id,
      named.snapshot.id,
    );
    assert.ok(snapshot);
    assert.equal(snapshot.document.project.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);

    const saved = await saveProjectForOrg(projects, admin, {
      id: created.id,
      name: "IL4 Versioned",
      metadata: created.metadata,
      implementations: {
        "ac-2": { status: "implemented", narrative: "after" },
        "grr-10": { status: "implemented", narrative: "grr after" },
      },
      expectedRevision: created.revision,
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) {
      return;
    }

    const restored = await restoreSnapshotForOrg(projects, admin, {
      projectId: created.id,
      snapshotId: named.snapshot.id,
      expectedRevision: saved.project.revision,
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) {
      return;
    }
    assert.equal(restored.project.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(restored.project.implementations["ac-2"]?.narrative, "before");
    assert.equal(restored.project.implementations["grr-10"]?.narrative, "grr before");

    const tampered = {
      schemaVersion: 1 as const,
      project: {
        ...snapshot.document.project,
        frameworkId: NIST_MODERATE_FRAMEWORK_ID,
        implementations: {
          ...snapshot.document.project.implementations,
          "AC.L2-3.1.1": { status: "not-started" as const, narrative: "bypass" },
        },
      },
    };
    await db
      .update(projectSnapshots)
      .set({ projectJson: serializeProjectDocument(tampered) })
      .where(eq(projectSnapshots.id, named.snapshot.id));

    const blocked = await restoreSnapshotForOrg(projects, admin, {
      projectId: created.id,
      snapshotId: named.snapshot.id,
      expectedRevision: restored.project.revision,
    });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.reason, "validation");
      assert.equal(blocked.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
    const stillIl4 = await loadProjectForOrg(projects, admin, created.id);
    assert.equal(stillIl4.ok, true);
    if (stillIl4.ok) {
      assert.equal(stillIl4.project.frameworkId, DOD_CLOUD_IL4_FRAMEWORK_ID);
      assert.equal(stillIl4.project.implementations["AC.L2-3.1.1"], undefined);
    }
  });

  it("restore keeps NIST and CMMC live framework identities", async () => {
    const { projects, admin } = await setup();
    const moderate = await createProjectForOrg(projects, admin, {
      name: "Moderate Versioned",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "not-started", narrative: "mod before" },
      },
    });
    const moderateVersion = await createNamedVersionForOrg(projects, admin, {
      projectId: moderate.id,
      name: "Moderate checkpoint",
      expectedRevision: moderate.revision,
    });
    assert.equal(moderateVersion.ok, true);
    if (!moderateVersion.ok) {
      return;
    }
    const moderateSaved = await saveProjectForOrg(projects, admin, {
      id: moderate.id,
      name: moderate.name,
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
      metadata: moderate.metadata,
      implementations: {
        "ac-1": { status: "implemented", narrative: "mod after" },
      },
      expectedRevision: moderate.revision,
    });
    assert.equal(moderateSaved.ok, true);
    if (!moderateSaved.ok) {
      return;
    }
    assert.equal(moderateSaved.project.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
    const moderateRestored = await restoreSnapshotForOrg(projects, admin, {
      projectId: moderate.id,
      snapshotId: moderateVersion.snapshot.id,
      expectedRevision: moderateSaved.project.revision,
    });
    assert.equal(moderateRestored.ok, true);
    if (moderateRestored.ok) {
      assert.equal(moderateRestored.project.frameworkId, NIST_MODERATE_FRAMEWORK_ID);
      assert.equal(
        moderateRestored.project.implementations["ac-1"]?.narrative,
        "mod before",
      );
    }

    const cmmc = await createProjectForOrg(projects, admin, {
      name: "CMMC Versioned",
      frameworkId: CMMC_LEVEL_2_FRAMEWORK_ID,
      implementations: {
        "AC.L2-3.1.1": { status: "not-started", narrative: "cmmc before" },
      },
    });
    const cmmcVersion = await createNamedVersionForOrg(projects, admin, {
      projectId: cmmc.id,
      name: "CMMC checkpoint",
      expectedRevision: cmmc.revision,
    });
    assert.equal(cmmcVersion.ok, true);
    if (!cmmcVersion.ok) {
      return;
    }
    const cmmcSaved = await saveProjectForOrg(projects, admin, {
      id: cmmc.id,
      name: cmmc.name,
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
      metadata: cmmc.metadata,
      implementations: {
        "AC.L2-3.1.1": { status: "implemented", narrative: "cmmc after" },
      },
      expectedRevision: cmmc.revision,
    });
    assert.equal(cmmcSaved.ok, true);
    if (!cmmcSaved.ok) {
      return;
    }
    assert.equal(cmmcSaved.project.frameworkId, CMMC_LEVEL_2_FRAMEWORK_ID);
    const cmmcRestored = await restoreSnapshotForOrg(projects, admin, {
      projectId: cmmc.id,
      snapshotId: cmmcVersion.snapshot.id,
      expectedRevision: cmmcSaved.project.revision,
    });
    assert.equal(cmmcRestored.ok, true);
    if (cmmcRestored.ok) {
      assert.equal(cmmcRestored.project.frameworkId, CMMC_LEVEL_2_FRAMEWORK_ID);
    }

    const low = await createProjectForOrg(projects, admin, {
      name: "Low Versioned",
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const lowVersion = await createNamedVersionForOrg(projects, admin, {
      projectId: low.id,
      name: "Low checkpoint",
      expectedRevision: low.revision,
    });
    assert.equal(lowVersion.ok, true);
    if (!lowVersion.ok) {
      return;
    }
    const lowRestored = await restoreSnapshotForOrg(projects, admin, {
      projectId: low.id,
      snapshotId: lowVersion.snapshot.id,
      expectedRevision: low.revision,
    });
    assert.equal(lowRestored.ok, true);
    if (lowRestored.ok) {
      assert.equal(lowRestored.project.frameworkId, NIST_LOW_FRAMEWORK_ID);
    }
  });
});
