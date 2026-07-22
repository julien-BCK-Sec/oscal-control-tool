import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { assembleProject } from "@/domain";
import { projectToOscalSsp } from "@/oscal/ssp/exportSsp";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresCommentRepository } from "@/persistence/postgres/comment-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createNotificationService } from "@/persistence/notification-service";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import {
  createDiscussionForOrg,
  deleteDiscussionForOrg,
  listDiscussionsForOrg,
} from "@/server/authorized-collaboration";
import {
  createAssignmentForOrg,
  listAssignmentsForOrg,
} from "@/server/authorized-assignments";
import {
  listNotificationsForUser,
  markNotificationReadForUser,
} from "@/server/authorized-notifications";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

function ctx(
  organizationId: string,
  role: OrgRole,
  userId: string,
): OrgContext {
  return { userId, organizationId, role };
}

async function setup() {
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b" });
  const projects = createPostgresProjectRepository(db);
  const projectA = await projects.create({
    name: "Project A",
    organizationId: orgA.id,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  const projectB = await projects.create({
    name: "Project B",
    organizationId: orgB.id,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  const discussions = createPostgresDiscussionService(db);
  const assignments = createPostgresAssignmentService(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );
  const comments = createPostgresCommentRepository(db);

  async function makeMember(
    organizationId: string,
    email: string,
    role: OrgRole,
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
    orgs,
    orgA,
    orgB,
    projects,
    projectA,
    projectB,
    discussions,
    assignments,
    notifications,
    comments,
    makeMember,
  };
}

describe("collaboration security (WP8)", () => {
  it("enforces tenant isolation across discussions, assignments, and notifications", async () => {
    const {
      orgs,
      orgA,
      orgB,
      projects,
      projectA,
      discussions,
      assignments,
      notifications,
      makeMember,
    } = await setup();
    const adminA = await makeMember(orgA.id, "a@example.com", "organization_admin");
    const adminB = await makeMember(orgB.id, "b@example.com", "organization_admin");
    const authorA = await makeMember(orgA.id, "author-a@example.com", "author");

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(orgA.id, "author", authorA.id),
      { projectId: projectA.id, controlId: "ac-2", body: "Tenant secret @a" },
      { actorId: authorA.id, actorDisplayName: "Author A" },
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    assert.deepEqual(
      await listDiscussionsForOrg(
        projects,
        discussions,
        ctx(orgB.id, "organization_admin", adminB.id),
        projectA.id,
        "ac-2",
      ),
      [],
    );

    const assignment = await createAssignmentForOrg(
      projects,
      assignments,
      orgs,
      notifications,
      ctx(orgA.id, "organization_admin", adminA.id),
      {
        projectId: projectA.id,
        controlId: "ac-2",
        assigneeUserId: authorA.id,
        assignmentRole: "owner",
      },
      { actorId: adminA.id, actorDisplayName: "Admin A" },
    );
    assert.equal(assignment.ok, true);

    assert.deepEqual(
      await listAssignmentsForOrg(
        projects,
        assignments,
        ctx(orgB.id, "organization_admin", adminB.id),
        projectA.id,
        "ac-2",
      ),
      [],
    );

    // Admin B must not mark Admin A's notifications.
    const notesA = await listNotificationsForUser(
      notifications,
      ctx(orgA.id, "organization_admin", adminA.id),
    );
    if (notesA[0]) {
      assert.equal(
        await markNotificationReadForUser(
          notifications,
          ctx(orgB.id, "organization_admin", adminB.id),
          notesA[0].id,
        ),
        null,
      );
    }
  });

  it("prevents privilege escalation for viewers and authors", async () => {
    const {
      orgs,
      orgA,
      projects,
      projectA,
      discussions,
      assignments,
      notifications,
      makeMember,
    } = await setup();
    const viewer = await makeMember(orgA.id, "viewer@example.com", "viewer");
    const author = await makeMember(orgA.id, "author@example.com", "author");
    const peer = await makeMember(orgA.id, "peer@example.com", "author");

    await assert.rejects(
      () =>
        createDiscussionForOrg(
          projects,
          discussions,
          orgs,
          notifications,
          ctx(orgA.id, "viewer", viewer.id),
          { projectId: projectA.id, controlId: "ac-2", body: "Nope" },
          { actorId: viewer.id, actorDisplayName: "Viewer" },
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );

    await assert.rejects(
      () =>
        createAssignmentForOrg(
          projects,
          assignments,
          orgs,
          notifications,
          ctx(orgA.id, "author", author.id),
          {
            projectId: projectA.id,
            controlId: "ac-2",
            assigneeUserId: peer.id,
            assignmentRole: "owner",
          },
          { actorId: author.id, actorDisplayName: "Author" },
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(orgA.id, "author", author.id),
      { projectId: projectA.id, controlId: "ac-2", body: "Mine" },
      { actorId: author.id, actorDisplayName: "Author" },
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    await assert.rejects(
      () =>
        deleteDiscussionForOrg(
          projects,
          discussions,
          ctx(orgA.id, "author", peer.id),
          created.comment.id,
          { actorId: peer.id, actorDisplayName: "Peer" },
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );
  });

  it("excludes collaboration metadata from OSCAL SSP export", async () => {
    const {
      orgs,
      orgA,
      projects,
      projectA,
      discussions,
      assignments,
      notifications,
      makeMember,
    } = await setup();
    const admin = await makeMember(orgA.id, "admin@example.com", "organization_admin");
    const author = await makeMember(orgA.id, "author@example.com", "author");

    await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(orgA.id, "author", author.id),
      {
        projectId: projectA.id,
        controlId: "ac-2",
        body: "COLLAB_SECRET_MARKER should never export",
      },
      { actorId: author.id, actorDisplayName: "Author" },
    );
    await createAssignmentForOrg(
      projects,
      assignments,
      orgs,
      notifications,
      ctx(orgA.id, "organization_admin", admin.id),
      {
        projectId: projectA.id,
        controlId: "ac-2",
        assigneeUserId: author.id,
        assignmentRole: "owner",
      },
      { actorId: admin.id, actorDisplayName: "Admin" },
    );

    const loaded = await projects.load(projectA.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) return;

    const domain = assembleProject({
      id: loaded.project.id,
      name: loaded.project.name,
      frameworkId: loaded.project.frameworkId,
      metadata: loaded.project.metadata,
      implementations: {
        ...loaded.project.implementations,
        "ac-2": {
          status: "in-progress",
          narrative: "Implementation narrative without collaboration data.",
        },
      },
      frameworkControls: FRAMEWORK_CONTROLS,
    });
    const ssp = projectToOscalSsp(domain, {
      lastModified: "2026-07-22T00:00:00.000Z",
      createUuid: (() => {
        let n = 0;
        return () => {
          n += 1;
          return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
        };
      })(),
    });
    const serialized = JSON.stringify(ssp);
    assert.equal(serialized.includes("COLLAB_SECRET_MARKER"), false);
    assert.equal(/"comments?"\s*:/.test(serialized), false);
    assert.equal(/"assignments?"\s*:/.test(serialized), false);
    assert.equal(/"notifications?"\s*:/.test(serialized), false);
  });
});
