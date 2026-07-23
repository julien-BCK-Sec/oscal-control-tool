import type { AppDatabase } from "@/persistence/postgres/client";
import type { StoredProject } from "@/persistence/types";
import type { ActorIdentity } from "@/persistence/actor";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createNotificationService } from "@/persistence/notification-service";
import {
  demoSeedMarker,
  hasDemoSeedMarker,
  GOOSE_FEATURED_CONTROLS,
} from "./constants";
import type { EnsuredUser } from "./identity";

function actor(user: EnsuredUser): ActorIdentity {
  return { actorId: user.id, actorDisplayName: user.name };
}

async function ensureRootComment(input: {
  discussions: ReturnType<typeof createPostgresDiscussionService>;
  organizationId: string;
  projectId: string;
  controlId: string;
  body: string;
  marker: string;
  author: EnsuredUser;
  mentionedUserIds?: string[];
}): Promise<{ id: string; created: boolean }> {
  const fullBody = `${input.body}${demoSeedMarker(input.marker)}`;
  const existing = await input.discussions.listComments(
    input.organizationId,
    input.projectId,
    input.controlId,
    { includeDeleted: true },
  );
  const found = existing.find((c) => hasDemoSeedMarker(c.body, input.marker));
  if (found) {
    return { id: found.id, created: false };
  }
  const created = await input.discussions.createComment(
    {
      organizationId: input.organizationId,
      projectId: input.projectId,
      controlId: input.controlId,
      body: fullBody,
      mentionedUserIds: input.mentionedUserIds,
    },
    actor(input.author),
  );
  return { id: created.comment.id, created: true };
}

async function ensureReply(input: {
  discussions: ReturnType<typeof createPostgresDiscussionService>;
  organizationId: string;
  projectId: string;
  controlId: string;
  parentCommentId: string;
  body: string;
  marker: string;
  author: EnsuredUser;
  mentionedUserIds?: string[];
}): Promise<{ id: string; created: boolean }> {
  const fullBody = `${input.body}${demoSeedMarker(input.marker)}`;
  const existing = await input.discussions.listComments(
    input.organizationId,
    input.projectId,
    input.controlId,
    { includeDeleted: true },
  );
  const found = existing.find((c) => hasDemoSeedMarker(c.body, input.marker));
  if (found) {
    return { id: found.id, created: false };
  }
  const created = await input.discussions.createComment(
    {
      organizationId: input.organizationId,
      projectId: input.projectId,
      controlId: input.controlId,
      parentCommentId: input.parentCommentId,
      body: fullBody,
      mentionedUserIds: input.mentionedUserIds,
    },
    actor(input.author),
  );
  return { id: created.comment.id, created: true };
}

async function ensureAssignment(input: {
  assignments: ReturnType<typeof createPostgresAssignmentService>;
  organizationId: string;
  projectId: string;
  controlId: string;
  assigneeUserId: string;
  assignmentRole: "owner" | "reviewer";
  assignedBy: EnsuredUser;
  complete?: boolean;
}): Promise<{ id: string; created: boolean }> {
  const listed = await input.assignments.listByControl(
    input.organizationId,
    input.projectId,
    input.controlId,
  );
  // One primary assignee per role per control for demo seed idempotency.
  const existing = listed.find(
    (row) => row.assignmentRole === input.assignmentRole,
  );
  if (existing) {
    if (existing.assigneeUserId !== input.assigneeUserId) {
      await input.assignments.reassign(
        input.organizationId,
        existing.id,
        input.assigneeUserId,
        actor(input.assignedBy),
      );
    }
    if (input.complete && !existing.completedAt) {
      await input.assignments.complete(
        input.organizationId,
        existing.id,
        actor(input.assignedBy),
      );
    }
    return { id: existing.id, created: false };
  }
  const created = await input.assignments.assign(
    {
      organizationId: input.organizationId,
      projectId: input.projectId,
      controlId: input.controlId,
      assigneeUserId: input.assigneeUserId,
      assignmentRole: input.assignmentRole,
      assignedByUserId: input.assignedBy.id,
    },
    actor(input.assignedBy),
  );
  if (input.complete) {
    await input.assignments.complete(
      input.organizationId,
      created.assignment.id,
      actor(input.assignedBy),
    );
  }
  return { id: created.assignment.id, created: true };
}

type UsersByEmail = Record<string, EnsuredUser>;

/**
 * Populate Milestone 02A collaboration data via discussion/assignment services.
 * Idempotent via demo-seed markers in comment bodies and assignment matching.
 */
export async function ensureDemoCollaboration(input: {
  db: AppDatabase;
  users: UsersByEmail;
  acmeOrgId: string;
  contosoOrgId: string;
  goose: StoredProject;
  customerA: StoredProject;
  lab: StoredProject;
  contosoCloud: StoredProject;
}): Promise<{ commentsCreated: number; assignmentsCreated: number }> {
  const discussions = createPostgresDiscussionService(input.db);
  const assignments = createPostgresAssignmentService(input.db);
  const controlRecords = createPostgresControlRecordService(input.db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(input.db),
  );

  const alice = input.users["alice@example.com"]!;
  const bob = input.users["bob@example.com"]!;
  const carol = input.users["carol@example.com"]!;
  const dave = input.users["dave@example.com"]!;
  const olivia = input.users["olivia@example.com"]!;
  const oscar = input.users["oscar@example.com"]!;
  const rachel = input.users["rachel@example.com"]!;

  let commentsCreated = 0;
  let assignmentsCreated = 0;

  // Control records / ownership metadata for featured Goose controls.
  for (const controlId of GOOSE_FEATURED_CONTROLS) {
    await controlRecords.upsertWithActivity(
      input.goose.id,
      {
        controlId,
        owner: carol.name,
        coOwner: bob.name,
        businessUnit: "Security Engineering",
        implementationStatus:
          controlId === "ac-2" || controlId === "ia-2" ? "in_review" : "draft",
        reviewDueDate: "2026-09-15",
        evidenceRequirement: "required",
      },
      actor(bob),
    );
  }

  // --- Goose AC-2 rich thread ---
  const ac2Root = await ensureRootComment({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ac-2",
    body: "Dave, can you verify the implementation evidence before we submit this?",
    marker: "goose-ac-2-root",
    author: carol,
  });
  if (ac2Root.created) commentsCreated += 1;

  const ac2Reply1 = await ensureReply({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ac-2",
    parentCommentId: ac2Root.id,
    body: "@carol Engineering confirmed MFA rollout yesterday.",
    marker: "goose-ac-2-reply-bob",
    author: bob,
    mentionedUserIds: [carol.id],
  });
  if (ac2Reply1.created) commentsCreated += 1;

  const ac2Reply2 = await ensureReply({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ac-2",
    parentCommentId: ac2Root.id,
    body: "This implementation looks good. Resolving.",
    marker: "goose-ac-2-reply-dave",
    author: dave,
  });
  if (ac2Reply2.created) commentsCreated += 1;

  // Resolve root once.
  const ac2Comments = await discussions.listComments(
    input.acmeOrgId,
    input.goose.id,
    "ac-2",
    { includeDeleted: true },
  );
  const ac2RootRow = ac2Comments.find((c) => c.id === ac2Root.id);
  if (ac2RootRow && !ac2RootRow.resolved) {
    await discussions.resolveDiscussion(
      input.acmeOrgId,
      ac2Root.id,
      actor(dave),
    );
  }

  // Alice follow-up on IA-2
  const ia2Root = await ensureRootComment({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ia-2",
    body: "Please ensure this control is complete before the next review.",
    marker: "goose-ia-2-root",
    author: alice,
  });
  if (ia2Root.created) commentsCreated += 1;

  const ia2Reply = await ensureReply({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ia-2",
    parentCommentId: ia2Root.id,
    body: "Working through authenticator policy updates with Olivia this week.",
    marker: "goose-ia-2-reply-carol",
    author: carol,
    mentionedUserIds: [olivia.id],
  });
  if (ia2Reply.created) commentsCreated += 1;

  // Soft-deleted comment on AU-2
  const au2Trash = await ensureRootComment({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "au-2",
    body: "Draft note — ignore, wrong control context.",
    marker: "goose-au-2-deleted",
    author: olivia,
  });
  if (au2Trash.created) {
    commentsCreated += 1;
    await discussions.softDeleteComment(
      input.acmeOrgId,
      au2Trash.id,
      actor(olivia),
    );
  }

  // Edited comment on SI-4
  const si4 = await ensureRootComment({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "si-4",
    body: "Monitoring coverage looks incomplete for NestWatch sensors — updated after ops review.",
    marker: "goose-si-4-edited",
    author: bob,
  });
  if (si4.created) {
    commentsCreated += 1;
    await discussions.editComment(
      input.acmeOrgId,
      si4.id,
      `Monitoring coverage looks incomplete for NestWatch sensors — updated after ops review.${demoSeedMarker("goose-si-4-edited")}`,
      actor(bob),
      [dave.id],
    );
  }

  // More featured control discussions
  for (const controlId of ["ia-5", "au-6", "sc-7", "cm-2"] as const) {
    const root = await ensureRootComment({
      discussions,
      organizationId: input.acmeOrgId,
      projectId: input.goose.id,
      controlId,
      body: `Status check on ${controlId.toUpperCase()}: please confirm owners and evidence path.`,
      marker: `goose-${controlId}-root`,
      author: bob,
    });
    if (root.created) commentsCreated += 1;
    const reply = await ensureReply({
      discussions,
      organizationId: input.acmeOrgId,
      projectId: input.goose.id,
      controlId,
      parentCommentId: root.id,
      body: `Acknowledged — ${controlId.toUpperCase()} is on Carol's queue.`,
      marker: `goose-${controlId}-reply`,
      author: carol,
    });
    if (reply.created) commentsCreated += 1;
  }

  // Goose assignments: mix of outstanding + completed + reassignment
  const a1 = await ensureAssignment({
    assignments,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ac-2",
    assigneeUserId: carol.id,
    assignmentRole: "owner",
    assignedBy: bob,
  });
  if (a1.created) assignmentsCreated += 1;

  const a2 = await ensureAssignment({
    assignments,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ac-2",
    assigneeUserId: dave.id,
    assignmentRole: "reviewer",
    assignedBy: bob,
    complete: true,
  });
  if (a2.created) assignmentsCreated += 1;

  // Seed Olivia as owner, then reassign to Carol (assignment matching is by role).
  const a3 = await ensureAssignment({
    assignments,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "ia-2",
    assigneeUserId: olivia.id,
    assignmentRole: "owner",
    assignedBy: alice,
  });
  if (a3.created) assignmentsCreated += 1;
  const a3Current = await assignments.getById(input.acmeOrgId, a3.id);
  if (a3Current && a3Current.assigneeUserId === olivia.id) {
    await assignments.reassign(
      input.acmeOrgId,
      a3.id,
      carol.id,
      actor(alice),
    );
  }

  const a4 = await ensureAssignment({
    assignments,
    organizationId: input.acmeOrgId,
    projectId: input.goose.id,
    controlId: "si-4",
    assigneeUserId: bob.id,
    assignmentRole: "owner",
    assignedBy: alice,
  });
  if (a4.created) assignmentsCreated += 1;

  // Notify Dave about mention-style alert (deduped if exists)
  await notifications.notify({
    organizationId: input.acmeOrgId,
    recipientUserId: dave.id,
    actorUserId: carol.id,
    eventType: "comment_mention",
    relatedObjectType: "comment",
    relatedObjectId: `demo-seed:goose-ac-2-mention`,
    projectId: input.goose.id,
    controlId: "ac-2",
    summary: "You were mentioned on control ac-2",
  });
  // Mark one read, leave others unread
  const daveNotes = await notifications.listForRecipient(dave.id, {
    limit: 20,
  });
  if (daveNotes[0] && !daveNotes[0].readAt) {
    await notifications.markRead(dave.id, daveNotes[0].id);
  }

  // Customer A — one discussion + one assignment
  const custRoot = await ensureRootComment({
    discussions,
    organizationId: input.acmeOrgId,
    projectId: input.customerA.id,
    controlId: "ac-2",
    body: "Kickoff note: Customer A package needs owner confirmation on AC-2.",
    marker: "customer-a-ac-2-root",
    author: bob,
  });
  if (custRoot.created) commentsCreated += 1;
  const custAssign = await ensureAssignment({
    assignments,
    organizationId: input.acmeOrgId,
    projectId: input.customerA.id,
    controlId: "ac-2",
    assigneeUserId: carol.id,
    assignmentRole: "owner",
    assignedBy: bob,
  });
  if (custAssign.created) assignmentsCreated += 1;

  // Lab — almost no collaboration (skip intentionally)

  // Contoso — a few discussions + assignments
  const contosoRoot = await ensureRootComment({
    discussions,
    organizationId: input.contosoOrgId,
    projectId: input.contosoCloud.id,
    controlId: "ac-2",
    body: "Contoso kickoff: please review boundary assumptions for AC-2.",
    marker: "contoso-ac-2-root",
    author: oscar,
  });
  if (contosoRoot.created) commentsCreated += 1;
  const contosoReply = await ensureReply({
    discussions,
    organizationId: input.contosoOrgId,
    projectId: input.contosoCloud.id,
    controlId: "ac-2",
    parentCommentId: contosoRoot.id,
    body: "Will review this week and file follow-ups.",
    marker: "contoso-ac-2-reply",
    author: rachel,
  });
  if (contosoReply.created) commentsCreated += 1;
  const contosoAssign = await ensureAssignment({
    assignments,
    organizationId: input.contosoOrgId,
    projectId: input.contosoCloud.id,
    controlId: "ia-2",
    assigneeUserId: rachel.id,
    assignmentRole: "reviewer",
    assignedBy: oscar,
  });
  if (contosoAssign.created) assignmentsCreated += 1;

  return { commentsCreated, assignmentsCreated };
}
