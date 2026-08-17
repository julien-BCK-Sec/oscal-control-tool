import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresEvidenceVersionService } from "@/persistence/postgres/evidence-version-service";
import { createPostgresControlActivityRepository } from "@/persistence/postgres/control-activity-repository";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createFilesystemObjectStorage } from "@/storage/filesystem-provider";
import { AuthorizationError } from "@/authz/authorize";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import {
  archiveEvidenceForOrg,
  associateEvidenceForOrg,
  createEvidenceForOrg,
  deleteDraftEvidenceForOrg,
  getEvidenceInventoryForOrg,
  getProjectEvidenceCoverageForOrg,
  listEvidenceForOrg,
} from "@/server/authorized-evidence";
import { createPostgresEvidenceCoverageQuery } from "@/persistence/postgres/evidence-coverage-query";
import { createProjectForOrg } from "@/server/authorized-projects";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const evidence = createPostgresEvidenceService(db);
  const storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-ev-authz-"));
  const versions = createPostgresEvidenceVersionService(
    db,
    createFilesystemObjectStorage(storageRoot),
  );
  const activities = createPostgresControlActivityRepository(db);
  const controlRecords = createPostgresControlRecordRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a-ev" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b-ev" });
  return {
    db,
    projects,
    evidence,
    versions,
    activities,
    controlRecords,
    orgA,
    orgB,
    storageRoot,
  };
}

function ctx(organizationId: string, role: OrgRole, userId = "u"): OrgContext {
  return { userId, organizationId, role };
}

const projectInput = {
  name: "Evidence System",
  frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  metadata: {
    systemName: "Evidence System",
    organizationName: "Org",
    systemDescription: "Desc",
  },
  implementations: {},
} as const;

describe("evidence service and authorization", () => {
  it("creates project-scoped evidence, links controls, and fans out activity", async () => {
    const { projects, evidence, activities, controlRecords, orgA } =
      await setup();
    const admin = ctx(orgA.id, "organization_admin");
    const project = await createProjectForOrg(projects, admin, projectInput);

    const created = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Access review export",
        evidenceType: "log",
        status: "active",
        controlIds: ["ac-2", "ac-3"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);
    if (!created.ok) {
      return;
    }
    assert.equal(created.evidence.controlIds.length, 2);

    const forControl = await listEvidenceForOrg(
      projects,
      evidence,
      admin,
      project.id,
      { controlId: "ac-2" },
    );
    assert.equal(forControl.length, 1);
    assert.equal(forControl[0]?.title, "Access review export");

    const record = await controlRecords.getByProjectAndControl(
      project.id,
      "ac-2",
    );
    assert.ok(record);
    assert.equal(record?.evidenceRequirement, "required");
    const history = await activities.listByControlRecordId(record!.id);
    assert.ok(
      history.some((row) => row.activityType === "evidence_added"),
      "expected evidence_added activity",
    );
  });

  it("archives evidence and hard-deletes only eligible drafts", async () => {
    const { projects, evidence, versions, orgA } = await setup();
    const admin = ctx(orgA.id, "organization_admin");
    const project = await createProjectForOrg(projects, admin, projectInput);

    const draft = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Draft only",
        evidenceType: "document",
        status: "draft",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(draft.ok, true);
    if (!draft.ok) {
      return;
    }

    const deleted = await deleteDraftEvidenceForOrg(
      projects,
      evidence,
      versions,
      admin,
      project.id,
      draft.evidence.id,
    );
    assert.equal(deleted.ok, true);

    const active = await createEvidenceForOrg(
      projects,
      evidence,
      admin,
      {
        projectId: project.id,
        title: "Active evidence",
        evidenceType: "document",
        status: "active",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(active.ok, true);
    if (!active.ok) {
      return;
    }

    const notDeletable = await deleteDraftEvidenceForOrg(
      projects,
      evidence,
      versions,
      admin,
      project.id,
      active.evidence.id,
    );
    assert.equal(notDeletable.ok, false);
    if (!notDeletable.ok) {
      assert.equal(notDeletable.reason, "not-deletable");
    }

    const archived = await archiveEvidenceForOrg(
      projects,
      evidence,
      admin,
      project.id,
      active.evidence.id,
      SYSTEM_ACTOR,
    );
    assert.equal(archived.ok, true);
    if (archived.ok) {
      assert.equal(archived.evidence.status, "archived");
    }
  });

  it("enforces tenant isolation and role permissions", async () => {
    const { projects, evidence, versions, orgA, orgB } = await setup();
    const adminA = ctx(orgA.id, "organization_admin");
    const adminB = ctx(orgB.id, "organization_admin");
    const viewer = ctx(orgA.id, "viewer");
    const author = ctx(orgA.id, "author");
    const project = await createProjectForOrg(projects, adminA, projectInput);

    const created = await createEvidenceForOrg(
      projects,
      evidence,
      author,
      {
        projectId: project.id,
        title: "Author evidence",
        evidenceType: "attestation",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);
    if (!created.ok) {
      return;
    }

    const crossTenant = await listEvidenceForOrg(
      projects,
      evidence,
      adminB,
      project.id,
    );
    assert.deepEqual(crossTenant, []);

    await assert.rejects(
      () =>
        createEvidenceForOrg(
          projects,
          evidence,
          viewer,
          {
            projectId: project.id,
            title: "Viewer attempt",
            evidenceType: "other",
          },
          SYSTEM_ACTOR,
        ),
      AuthorizationError,
    );

    const linked = await associateEvidenceForOrg(
      projects,
      evidence,
      author,
      project.id,
      created.evidence.id,
      "ac-2",
      SYSTEM_ACTOR,
    );
    assert.equal(linked.ok, true);

    await assert.rejects(
      () =>
        deleteDraftEvidenceForOrg(
          projects,
          evidence,
          versions,
          author,
          project.id,
          created.evidence.id,
        ),
      AuthorizationError,
    );
  });

  it("allows viewers to read coverage and denies cross-tenant reporting", async () => {
    const { db, projects, evidence, orgA, orgB } = await setup();
    const coverageQuery = createPostgresEvidenceCoverageQuery(db);
    const adminA = ctx(orgA.id, "organization_admin");
    const adminB = ctx(orgB.id, "organization_admin");
    const viewer = ctx(orgA.id, "viewer");
    const project = await createProjectForOrg(projects, adminA, projectInput);

    await createEvidenceForOrg(
      projects,
      evidence,
      adminA,
      {
        projectId: project.id,
        title: "Active attestation",
        evidenceType: "attestation",
        status: "active",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );

    const viewerCoverage = await getProjectEvidenceCoverageForOrg(
      projects,
      coverageQuery,
      viewer,
      project.id,
      ["ac-2"],
      "2026-06-01",
    );
    assert.ok(viewerCoverage);
    assert.equal(viewerCoverage?.summary.requiredWithEvidence, 1);

    const cross = await getProjectEvidenceCoverageForOrg(
      projects,
      coverageQuery,
      adminB,
      project.id,
      ["ac-2"],
      "2026-06-01",
    );
    assert.equal(cross, null);

    const inventory = await getEvidenceInventoryForOrg(
      projects,
      coverageQuery,
      viewer,
      project.id,
      ["ac-2"],
      "2026-06-01",
    );
    assert.ok(inventory);
    assert.equal(inventory?.rows.length, 1);

    const crossInventory = await getEvidenceInventoryForOrg(
      projects,
      coverageQuery,
      adminB,
      project.id,
      ["ac-2"],
      "2026-06-01",
    );
    assert.equal(crossInventory, null);
  });

  it("fails closed when organization context is missing", async () => {
    const { db, projects } = await setup();
    const coverageQuery = createPostgresEvidenceCoverageQuery(db);
    await assert.rejects(
      () =>
        getProjectEvidenceCoverageForOrg(
          projects,
          coverageQuery,
          null as unknown as OrgContext,
          "project-x",
          ["ac-1"],
          "2026-06-01",
        ),
      AuthorizationError,
    );
  });
});
