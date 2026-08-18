import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { DEFAULT_CONTROL_RECORD_FIELDS } from "@/data/control-record";
import { resolveFrameworkControls } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import {
  associateEvidenceForOrg,
  createEvidenceForOrg,
} from "@/server/authorized-evidence";
import {
  transitionReviewForOrg,
  upsertControlRecordsForOrg,
} from "@/server/authorized-controls";
import { saveProjectForOrg } from "@/server/authorized-projects";
import { UNKNOWN_FRAMEWORK_CONTROL_MESSAGE } from "@/server/project-control-identity";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const evidence = createPostgresEvidenceService(db);
  const controlService = createPostgresControlRecordService(db);
  return { projects, org, evidence, controlService };
}

function ctx(
  organizationId: string,
  role: OrgRole = "organization_admin",
): OrgContext {
  return { userId: "u-admin", organizationId, role };
}

function highOnlyControlId(): string {
  const lowIds = new Set(
    resolveFrameworkControls(NIST_LOW_FRAMEWORK_ID).map((c) => c.id),
  );
  const highOnly = resolveFrameworkControls(NIST_HIGH_FRAMEWORK_ID).find(
    (control) => !lowIds.has(control.id),
  );
  assert.ok(highOnly);
  return highOnly.id;
}

describe("project framework control identity", () => {
  it("lets Moderate projects keep Evidence links to Moderate controls", async () => {
    const { projects, org, evidence } = await setup();
    const project = await projects.create({
      name: "Moderate",
      organizationId: org.id,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const created = await createEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      {
        projectId: project.id,
        title: "Policy",
        evidenceType: "policy",
        status: "draft",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);
    if (created.ok) {
      assert.deepEqual(created.evidence.controlIds, ["ac-2"]);
    }
  });

  it("rejects Evidence links to controls outside the project's framework", async () => {
    const { projects, org, evidence } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const outsideId = highOnlyControlId();
    const created = await createEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      {
        projectId: project.id,
        title: "Policy",
        evidenceType: "policy",
        status: "draft",
        controlIds: [outsideId],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, false);
    if (!created.ok) {
      assert.equal(created.reason, "validation");
      assert.equal(created.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }

    const unlinked = await createEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      {
        projectId: project.id,
        title: "Unlinked",
        evidenceType: "other",
        status: "draft",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(unlinked.ok, true);
    if (!unlinked.ok) {
      return;
    }
    const associated = await associateEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      project.id,
      unlinked.evidence.id,
      outsideId,
      SYSTEM_ACTOR,
    );
    assert.equal(associated.ok, false);
    if (!associated.ok) {
      assert.equal(associated.reason, "validation");
    }
  });

  it("rejects ControlRecord upserts for controls outside the project's framework", async () => {
    const { projects, org, controlService } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const result = await upsertControlRecordsForOrg(
      projects,
      controlService,
      ctx(org.id),
      project.id,
      [
        {
          controlId: highOnlyControlId(),
          ...DEFAULT_CONTROL_RECORD_FIELDS,
        },
      ],
      SYSTEM_ACTOR,
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "validation");
      assert.equal(result.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
  });

  it("does not leak another organization's project while validating control IDs", async () => {
    const { projects, org, evidence } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const outsider: OrgContext = {
      userId: "u-other",
      organizationId: "org-other",
      role: "organization_admin",
    };
    const result = await createEvidenceForOrg(
      projects,
      evidence,
      outsider,
      {
        projectId: project.id,
        title: "Nope",
        evidenceType: "other",
        status: "draft",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not-found");
    }
  });

  it("rejects review transitions for controls outside the project's framework", async () => {
    const { projects, org, controlService } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const outsideId = highOnlyControlId();
    const result = await transitionReviewForOrg(
      projects,
      controlService,
      ctx(org.id),
      {
        projectId: project.id,
        controlId: outsideId,
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "validation");
      assert.equal(result.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
    const records = await controlService.listByProject(project.id);
    assert.equal(records.some((record) => record.controlId === outsideId), false);
  });

  it("still lazily creates a ControlRecord for a valid framework control on review", async () => {
    const { projects, org, controlService } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const result = await transitionReviewForOrg(
      projects,
      controlService,
      ctx(org.id),
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.created, true);
      assert.equal(result.record.controlId, "ac-2");
    }
  });

  it("does not leak another organization's project on invalid review control IDs", async () => {
    const { projects, org, controlService } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const outsider: OrgContext = {
      userId: "u-other",
      organizationId: "org-other",
      role: "organization_admin",
    };
    const result = await transitionReviewForOrg(
      projects,
      controlService,
      outsider,
      {
        projectId: project.id,
        controlId: highOnlyControlId(),
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not-found");
    }
  });

  it("rejects project saves that include out-of-framework implementation keys", async () => {
    const { projects, org } = await setup();
    const project = await projects.create({
      name: "Low",
      organizationId: org.id,
      frameworkId: NIST_LOW_FRAMEWORK_ID,
    });
    const result = await saveProjectForOrg(projects, ctx(org.id), {
      id: project.id,
      name: project.name,
      metadata: project.metadata,
      implementations: {
        "ac-1": { status: "implemented", narrative: "ok" },
        "not-a-control": { status: "not-started", narrative: "nope" },
      },
      expectedRevision: project.revision,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "validation");
      assert.equal(result.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
  });

  it("rejects 800-53 control IDs on a CMMC Level 2 project", async () => {
    const { projects, org, evidence, controlService } = await setup();
    const project = await projects.create({
      name: "CMMC",
      organizationId: org.id,
      frameworkId: CMMC_LEVEL_2_FRAMEWORK_ID,
    });
    const created = await createEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      {
        projectId: project.id,
        title: "Policy",
        evidenceType: "policy",
        status: "draft",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, false);
    if (!created.ok) {
      assert.equal(created.reason, "validation");
      assert.equal(created.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
    const review = await transitionReviewForOrg(
      projects,
      controlService,
      ctx(org.id),
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(review.ok, false);
    if (!review.ok) {
      assert.equal(review.reason, "validation");
    }
  });

  it("accepts CMMC requirement IDs on CMMC projects and rejects them on Moderate", async () => {
    const { projects, org, evidence } = await setup();
    const cmmc = await projects.create({
      name: "CMMC",
      organizationId: org.id,
      frameworkId: CMMC_LEVEL_2_FRAMEWORK_ID,
    });
    const created = await createEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      {
        projectId: cmmc.id,
        title: "Policy",
        evidenceType: "policy",
        status: "draft",
        controlIds: ["AC.L2-3.1.1"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(created.ok, true);
    if (created.ok) {
      assert.deepEqual(created.evidence.controlIds, ["AC.L2-3.1.1"]);
    }

    const moderate = await projects.create({
      name: "Moderate",
      organizationId: org.id,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const rejected = await createEvidenceForOrg(
      projects,
      evidence,
      ctx(org.id),
      {
        projectId: moderate.id,
        title: "Policy",
        evidenceType: "policy",
        status: "draft",
        controlIds: ["AC.L2-3.1.1"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(rejected.ok, false);
    if (!rejected.ok) {
      assert.equal(rejected.reason, "validation");
      assert.equal(rejected.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
  });
});
