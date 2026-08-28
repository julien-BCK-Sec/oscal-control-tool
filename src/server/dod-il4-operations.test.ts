import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { DEFAULT_CONTROL_RECORD_FIELDS } from "@/data/control-record";
import { validateEvidenceUpload } from "@/data/evidence";
import { dodCloudIl4FrameworkProvider } from "@/data/framework";
import {
  createDomainEventRuntime,
  setSharedDomainEventRuntime,
  type DomainEvent,
} from "@/domain/events";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlActivityRepository } from "@/persistence/postgres/control-activity-repository";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresEvidenceCoverageQuery } from "@/persistence/postgres/evidence-coverage-query";
import { createPostgresEvidenceService } from "@/persistence/postgres/evidence-service";
import { createPostgresEvidenceVersionService } from "@/persistence/postgres/evidence-version-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createNotificationService } from "@/persistence/notification-service";
import { createFilesystemObjectStorage } from "@/storage/filesystem-provider";
import {
  createAssignmentForOrg,
  listAssignmentsForOrg,
} from "@/server/authorized-assignments";
import {
  createDiscussionForOrg,
  listDiscussionsForOrg,
} from "@/server/authorized-collaboration";
import {
  listControlActivitiesForOrg,
  listControlRecordsForOrg,
  transitionReviewForOrg,
  upsertControlRecordsForOrg,
} from "@/server/authorized-controls";
import {
  associateEvidenceForOrg,
  createEvidenceForOrg,
  dissociateEvidenceForOrg,
  downloadEvidenceVersionForOrg,
  getProjectEvidenceCoverageForOrg,
  listEvidenceForOrg,
  searchEvidenceForOrg,
  uploadEvidenceVersionForOrg,
} from "@/server/authorized-evidence";
import { createProjectForOrg } from "@/server/authorized-projects";
import { UNKNOWN_FRAMEWORK_CONTROL_MESSAGE } from "@/server/project-control-identity";
import { resetWorkflowEngineSubscriptionForTests } from "@/workflow/runtime";

afterEach(async () => {
  await closeDb();
  setSharedDomainEventRuntime(null);
  resetWorkflowEngineSubscriptionForTests();
});

function ctx(
  organizationId: string,
  role: OrgRole = "organization_admin",
  userId = "u-admin",
): OrgContext {
  return { userId, organizationId, role };
}

async function setup() {
  const runtime = createDomainEventRuntime();
  setSharedDomainEventRuntime(runtime);
  const db = await openTestDb();
  const projects = createPostgresProjectRepository(db);
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({ name: "Org A", slug: "org-a-il4" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b-il4" });
  const evidence = createPostgresEvidenceService(db);
  const coverageQuery = createPostgresEvidenceCoverageQuery(db);
  const controlService = createPostgresControlRecordService(db);
  const controlRecords = createPostgresControlRecordRepository(db);
  const activities = createPostgresControlActivityRepository(db);
  const assignments = createPostgresAssignmentService(db);
  const discussions = createPostgresDiscussionService(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );
  const storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-il4-ev-"));
  const versions = createPostgresEvidenceVersionService(
    db,
    createFilesystemObjectStorage(storageRoot),
  );
  const admin = ctx(org.id);

  async function makeMember(
    organizationId: string,
    email: string,
    role: OrgRole = "author",
  ) {
    const id = randomUUID();
    const now = new Date();
    await db.insert(userTable).values({
      id,
      name: email,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await orgs.upsertMembership({ organizationId, userId: id, role });
    return { id, email };
  }

  return {
    runtime,
    db,
    projects,
    orgs,
    org,
    orgB,
    evidence,
    coverageQuery,
    controlService,
    controlRecords,
    activities,
    assignments,
    discussions,
    notifications,
    versions,
    storageRoot,
    admin,
    makeMember,
  };
}

function eventTypes(events: readonly DomainEvent[]): string[] {
  return events.map((event) => event.eventType);
}

describe("DoD IL4 generic Evidence/workflow operations", () => {
  it("creates, links, unlinks, searches, and versions Evidence on IL4 NIST items and GRRs", async () => {
    const env = await setup();
    const project = await createProjectForOrg(env.projects, env.admin, {
      name: "IL4 Evidence",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });

    const ac2 = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        title: "Account management procedure",
        evidenceType: "policy",
        status: "active",
        controlIds: ["ac-2"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(ac2.ok, true);
    if (!ac2.ok) {
      return;
    }

    const grr1 = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        title: "PKI enrollment questionnaire",
        evidenceType: "attestation",
        status: "active",
        controlIds: ["grr-1"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(grr1.ok, true);
    if (!grr1.ok) {
      return;
    }

    const shared = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        title: "Shared architecture package",
        evidenceType: "document",
        status: "active",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(shared.ok, true);
    if (!shared.ok) {
      return;
    }

    const picker = await searchEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        excludeLinkedToControlId: "grr-10",
      },
    );
    assert.ok(picker.items.some((item) => item.id === shared.evidence.id));
    assert.ok(picker.items.some((item) => item.id === ac2.evidence.id));

    for (const controlId of ["sc-24", "sc-46", "grr-10"] as const) {
      const associated = await associateEvidenceForOrg(
        env.projects,
        env.evidence,
        env.admin,
        project.id,
        shared.evidence.id,
        controlId,
        SYSTEM_ACTOR,
      );
      assert.equal(associated.ok, true);
    }

    const unlinked = await dissociateEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      project.id,
      ac2.evidence.id,
      "ac-2",
      SYSTEM_ACTOR,
    );
    assert.equal(unlinked.ok, true);
    if (unlinked.ok) {
      assert.equal(unlinked.evidence.controlIds.includes("ac-2"), false);
    }
    const remainingAc2 = await listEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      project.id,
      { controlId: "ac-2" },
    );
    assert.equal(remainingAc2.length, 0);
    const linkedGrr = await listEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      project.id,
      { controlId: "grr-1" },
    );
    assert.equal(linkedGrr.length, 1);

    const validated = validateEvidenceUpload({
      filename: "grr-1.txt",
      declaredMimeType: "text/plain",
      body: Buffer.from("grr-1 evidence"),
      maxBytes: 25 * 1024 * 1024,
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) {
      return;
    }
    const uploaded = await uploadEvidenceVersionForOrg(
      env.projects,
      env.versions,
      env.admin,
      {
        projectId: project.id,
        evidenceId: grr1.evidence.id,
        upload: validated.value,
      },
      SYSTEM_ACTOR,
    );
    assert.equal(uploaded.ok, true);
    if (!uploaded.ok) {
      return;
    }
    const downloaded = await downloadEvidenceVersionForOrg(
      env.projects,
      env.versions,
      env.admin,
      project.id,
      grr1.evidence.id,
      uploaded.version.id,
    );
    assert.equal(downloaded.ok, true);
    if (downloaded.ok) {
      assert.equal(downloaded.body.toString("utf8"), "grr-1 evidence");
    }

    const outsider = ctx(env.orgB.id, "organization_admin", "u-other");
    const crossOrg = await associateEvidenceForOrg(
      env.projects,
      env.evidence,
      outsider,
      project.id,
      shared.evidence.id,
      "grr-1",
      SYSTEM_ACTOR,
    );
    assert.equal(crossOrg.ok, false);
    if (!crossOrg.ok) {
      assert.equal(crossOrg.reason, "not-found");
    }

    const otherProject = await createProjectForOrg(env.projects, env.admin, {
      name: "Other IL4",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });
    const crossProject = await associateEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      otherProject.id,
      shared.evidence.id,
      "grr-1",
      SYSTEM_ACTOR,
    );
    assert.equal(crossProject.ok, false);
    if (!crossProject.ok) {
      assert.equal(crossProject.reason, "not-found");
    }

    await fs.rm(env.storageRoot, { recursive: true, force: true });
  });

  it("keeps Evidence Coverage denominator at 345 including GRRs and 03D eligibility", async () => {
    const env = await setup();
    const project = await createProjectForOrg(env.projects, env.admin, {
      name: "IL4 Coverage",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });
    const frameworkIds = dodCloudIl4FrameworkProvider
      .getFramework()
      .controls.map((control) => control.id);
    assert.equal(frameworkIds.length, 345);

    const empty = await getProjectEvidenceCoverageForOrg(
      env.projects,
      env.coverageQuery,
      env.admin,
      project.id,
      "2026-08-27",
    );
    assert.ok(empty);
    assert.equal(empty.summary.totalControls, 345);
    assert.equal(empty.summary.requiredControls, 345);
    assert.equal(empty.summary.requiredMissingEvidence, 345);
    assert.equal(empty.summary.requiredWithEvidence, 0);
    assert.ok(empty.controls.some((row) => row.controlId === "grr-1"));
    assert.ok(empty.controls.some((row) => row.controlId === "grr-10"));
    assert.ok(empty.controls.some((row) => row.controlId === "sc-46"));
    const missingGrr = empty.controls.find((row) => row.controlId === "grr-10");
    assert.equal(missingGrr?.coverageState, "required_missing");
    const sc46 = empty.controls.find((row) => row.controlId === "sc-46");
    assert.equal(sc46?.coverageState, "required_missing");
    assert.equal(sc46?.evidenceRequirement, "required");

    const active = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        title: "Active GRR packet",
        evidenceType: "document",
        status: "active",
        controlIds: ["grr-1"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(active.ok, true);

    const draft = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        title: "Draft only",
        evidenceType: "document",
        status: "draft",
        controlIds: ["grr-10"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(draft.ok, true);
    if (!draft.ok) {
      return;
    }

    const archived = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: project.id,
        title: "Soon archived",
        evidenceType: "other",
        status: "active",
        controlIds: ["sc-24"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(archived.ok, true);
    if (!archived.ok) {
      return;
    }
    await env.evidence.archive(project.id, archived.evidence.id, SYSTEM_ACTOR);

    const covered = await getProjectEvidenceCoverageForOrg(
      env.projects,
      env.coverageQuery,
      env.admin,
      project.id,
      "2026-08-27",
    );
    assert.ok(covered);
    assert.equal(covered.summary.totalControls, 345);
    const presentGrr = covered.controls.find((row) => row.controlId === "grr-1");
    assert.equal(presentGrr?.coverageState, "required_present");
    assert.equal(presentGrr?.activeEvidenceCount, 1);
    assert.equal(presentGrr?.evidenceWithoutCurrentVersionCount, 1);
    const stillMissing = covered.controls.find((row) => row.controlId === "grr-10");
    assert.equal(stillMissing?.coverageState, "required_missing");
    assert.equal(stillMissing?.draftEvidenceCount, 1);
    const archivedLink = covered.controls.find((row) => row.controlId === "sc-24");
    assert.equal(archivedLink?.coverageState, "required_missing");
    assert.equal(covered.summary.requiredWithEvidence, 1);
    assert.equal(covered.summary.requiredMissingEvidence, 344);
  });

  it("reviews IL4 NIST items and GRRs without overlay metadata mutating operational state", async () => {
    const env = await setup();
    const project = await createProjectForOrg(env.projects, env.admin, {
      name: "IL4 Review",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });
    const overlay = dodCloudIl4FrameworkProvider.getFramework();
    const ia51 = overlay.controls.find((control) => control.id === "ia-5.1");
    const ac7 = overlay.controls.find((control) => control.id === "ac-7");
    const sc46 = overlay.controls.find((control) => control.id === "sc-46");
    assert.equal(ia51?.parameters?.interpretationConflict, true);
    assert.equal(ac7?.parameters?.authoritativeValueStatus, "authoritative-value-required");
    assert.equal(sc46?.applicability?.condition, "cds");

    const beforeCoverage = await getProjectEvidenceCoverageForOrg(
      env.projects,
      env.coverageQuery,
      env.admin,
      project.id,
      "2026-08-27",
    );
    assert.ok(beforeCoverage);
    const beforeRecords = await listControlRecordsForOrg(
      env.projects,
      env.controlRecords,
      env.admin,
      project.id,
    );
    assert.equal(beforeRecords.length, 0);
    assert.equal(project.implementations["ac-7"], undefined);
    assert.equal(project.implementations["ia-5.1"], undefined);
    assert.equal(project.implementations["sc-46"], undefined);

    for (const controlId of ["ac-2", "ac-7", "ia-5.1", "sc-46", "grr-1"] as const) {
      const result = await transitionReviewForOrg(
        env.projects,
        env.controlService,
        env.admin,
        {
          projectId: project.id,
          controlId,
          action: "submit_for_review",
          expectedCurrentStatus: "not_reviewed",
        },
        SYSTEM_ACTOR,
      );
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.record.reviewStatus, "ready_for_review");
        assert.equal(result.record.implementationStatus, "draft");
        assert.equal(result.record.evidenceRequirement, "required");
        assert.equal(
          Object.prototype.hasOwnProperty.call(result.record, "parameters"),
          false,
        );
        assert.equal(
          Object.prototype.hasOwnProperty.call(result.record, "supplements"),
          false,
        );
        assert.equal(
          Object.prototype.hasOwnProperty.call(result.record, "applicability"),
          false,
        );
      }
    }

    const sc46Record = await env.controlRecords.getByProjectAndControl(
      project.id,
      "sc-46",
    );
    assert.ok(sc46Record);
    assert.notEqual(sc46Record.implementationStatus, "deprecated");
    assert.equal(sc46Record.reviewStatus, "ready_for_review");

    const afterCoverage = await getProjectEvidenceCoverageForOrg(
      env.projects,
      env.coverageQuery,
      env.admin,
      project.id,
      "2026-08-27",
    );
    assert.ok(afterCoverage);
    assert.equal(afterCoverage.summary.totalControls, 345);
    assert.ok(afterCoverage.controls.some((row) => row.controlId === "sc-46"));
  });

  it("assigns, discusses, and records activity on IL4 items including GRRs", async () => {
    const env = await setup();
    const manager = await env.makeMember(
      env.org.id,
      "pm@example.com",
      "project_manager",
    );
    const author = await env.makeMember(env.org.id, "author@example.com");
    const managerCtx = ctx(env.org.id, "project_manager", manager.id);
    const project = await createProjectForOrg(env.projects, managerCtx, {
      name: "IL4 Collab",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });

    const assignment = await createAssignmentForOrg(
      env.projects,
      env.assignments,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: project.id,
        controlId: "ac-7",
        assigneeUserId: author.id,
        assignmentRole: "owner",
      },
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(assignment.ok, true);
    const listed = await listAssignmentsForOrg(
      env.projects,
      env.assignments,
      managerCtx,
      project.id,
      "ac-7",
    );
    assert.equal(listed.length, 1);

    const discussion = await createDiscussionForOrg(
      env.projects,
      env.discussions,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: project.id,
        controlId: "grr-1",
        body: `Please review GRR-1 @${author.email}`,
      },
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(discussion.ok, true);
    const comments = await listDiscussionsForOrg(
      env.projects,
      env.discussions,
      managerCtx,
      project.id,
      "grr-1",
    );
    assert.equal(comments.length, 1);

    const ia51Discussion = await createDiscussionForOrg(
      env.projects,
      env.discussions,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: project.id,
        controlId: "ia-5.1",
        body: "Source interpretation requires review; no winner chosen.",
      },
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(ia51Discussion.ok, true);

    const ac7Activity = await listControlActivitiesForOrg(
      env.projects,
      env.controlRecords,
      env.activities,
      managerCtx,
      project.id,
      "ac-7",
    );
    assert.ok(ac7Activity.some((row) => row.activityType === "assignment_changed"));
    const grrActivity = await listControlActivitiesForOrg(
      env.projects,
      env.controlRecords,
      env.activities,
      managerCtx,
      project.id,
      "grr-1",
    );
    assert.ok(grrActivity.some((row) => row.activityType === "comment_added"));

    const published = env.runtime.diagnostics.listRecentEvents(env.org.id, 50);
    const types = eventTypes(published.map((row) => row.event));
    assert.ok(types.includes("ProjectCreated"));
    assert.ok(types.includes("AssignmentCreated"));
    assert.ok(types.includes("ControlAssigned"));
    assert.ok(types.includes("DiscussionCreated"));
    assert.ok(types.includes("NotificationCreated"));

    const moderate = await createProjectForOrg(env.projects, managerCtx, {
      name: "Moderate",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const rejectedGrr = await createDiscussionForOrg(
      env.projects,
      env.discussions,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: moderate.id,
        controlId: "grr-1",
        body: "Should not write",
      },
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(rejectedGrr.ok, false);
    if (!rejectedGrr.ok) {
      assert.equal(rejectedGrr.reason, "validation");
      assert.equal(rejectedGrr.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
    assert.equal(
      (await env.discussions.listComments(env.org.id, moderate.id, "grr-1")).length,
      0,
    );
  });

  it("rejects cross-framework Evidence and ControlRecord IDs before operational writes", async () => {
    const env = await setup();
    const il4 = await createProjectForOrg(env.projects, env.admin, {
      name: "IL4",
      frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    });
    const moderate = await createProjectForOrg(env.projects, env.admin, {
      name: "Moderate",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const cmmc = await createProjectForOrg(env.projects, env.admin, {
      name: "CMMC",
      frameworkId: CMMC_LEVEL_2_FRAMEWORK_ID,
    });

    for (const controlId of ["sc-24", "sc-46", "grr-1"] as const) {
      const created = await createEvidenceForOrg(
        env.projects,
        env.evidence,
        env.admin,
        {
          projectId: moderate.id,
          title: "Nope",
          evidenceType: "other",
          status: "draft",
          controlIds: [controlId],
        },
        SYSTEM_ACTOR,
      );
      assert.equal(created.ok, false);
      if (!created.ok) {
        assert.equal(created.reason, "validation");
        assert.equal(created.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
      }
    }

    const cmmcRejectsIl4 = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: cmmc.id,
        title: "Nope",
        evidenceType: "other",
        status: "draft",
        controlIds: ["grr-1"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(cmmcRejectsIl4.ok, false);

    const il4RejectsCmmc = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      env.admin,
      {
        projectId: il4.id,
        title: "Nope",
        evidenceType: "other",
        status: "draft",
        controlIds: ["AC.L2-3.1.1"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(il4RejectsCmmc.ok, false);
    if (!il4RejectsCmmc.ok) {
      assert.equal(il4RejectsCmmc.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }

    const unknown = await createEvidenceForOrg(
      env.projects,
      env.evidence,
      ctx("org-missing", "organization_admin", "u-missing"),
      {
        projectId: il4.id,
        title: "Nope",
        evidenceType: "other",
        status: "draft",
        controlIds: ["not-a-control"],
      },
      SYSTEM_ACTOR,
    );
    assert.equal(unknown.ok, false);
    if (!unknown.ok) {
      assert.equal(unknown.reason, "not-found");
    }

    const authorized = await upsertControlRecordsForOrg(
      env.projects,
      env.controlService,
      env.admin,
      moderate.id,
      [{ controlId: "grr-1", ...DEFAULT_CONTROL_RECORD_FIELDS }],
      SYSTEM_ACTOR,
    );
    assert.equal(authorized.ok, false);
    if (!authorized.ok) {
      assert.equal(authorized.reason, "validation");
      assert.equal(authorized.message, UNKNOWN_FRAMEWORK_CONTROL_MESSAGE);
    }
    assert.equal(
      (await env.controlRecords.getByProjectAndControl(moderate.id, "grr-1")) ==
        null,
      true,
    );
  });
});
