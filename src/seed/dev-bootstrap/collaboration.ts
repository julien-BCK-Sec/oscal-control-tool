import type { AppDatabase } from "@/persistence/postgres/client";
import type { StoredProject } from "@/persistence/types";
import type { ActorIdentity } from "@/persistence/actor";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createNotificationService } from "@/persistence/notification-service";
import type { UpsertControlRecordInput } from "@/data/control-record";
import { demoSeedMarker, hasDemoSeedMarker } from "./constants";
import type { EnsuredUser } from "./identity";
import { DEMO_PEOPLE } from "@/seed/demo/world";

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
  const existing = listed.find(
    (row) => row.assignmentRole === input.assignmentRole,
  );
  if (existing) {
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

const FLAGSHIP_CONTROL_RECORDS: readonly UpsertControlRecordInput[] = [
  {
    controlId: "ac-2",
    owner: DEMO_PEOPLE.priyaSharma.name,
    coOwner: DEMO_PEOPLE.garyMercer.name,
    businessUnit: "Avian Cybersecurity Unit",
    implementationStatus: "in_review",
    reviewDueDate: "2026-09-15",
    evidenceRequirement: "required",
  },
  {
    controlId: "ia-2",
    owner: DEMO_PEOPLE.priyaSharma.name,
    coOwner: DEMO_PEOPLE.steveKowalski.name,
    businessUnit: "Avian Cybersecurity Unit",
    implementationStatus: "in_review",
    reviewDueDate: "2026-09-15",
    evidenceRequirement: "required",
  },
  {
    controlId: "ia-5",
    owner: DEMO_PEOPLE.priyaSharma.name,
    coOwner: "",
    businessUnit: "Avian Cybersecurity Unit",
    implementationStatus: "implemented",
    reviewDueDate: "2026-10-01",
    evidenceRequirement: "required",
  },
  {
    controlId: "au-2",
    owner: DEMO_PEOPLE.caseyTremblay.name,
    coOwner: DEMO_PEOPLE.priyaSharma.name,
    businessUnit: "National Honk Operations Centre",
    implementationStatus: "approved",
    reviewDueDate: null,
    evidenceRequirement: "required",
  },
  {
    controlId: "au-6",
    owner: DEMO_PEOPLE.caseyTremblay.name,
    coOwner: "",
    businessUnit: "National Honk Operations Centre",
    implementationStatus: "implemented",
    reviewDueDate: "2026-11-01",
    evidenceRequirement: "required",
  },
  {
    controlId: "sc-7",
    owner: DEMO_PEOPLE.caseyTremblay.name,
    coOwner: DEMO_PEOPLE.steveKowalski.name,
    businessUnit: "HonkNet",
    implementationStatus: "draft",
    reviewDueDate: "2026-12-01",
    evidenceRequirement: "required",
  },
  {
    controlId: "si-4",
    owner: DEMO_PEOPLE.caseyTremblay.name,
    coOwner: "",
    businessUnit: "HonkNet",
    implementationStatus: "implemented",
    reviewDueDate: "2026-09-20",
    evidenceRequirement: "required",
  },
  {
    controlId: "cm-2",
    owner: DEMO_PEOPLE.rileyNguyen.name,
    coOwner: DEMO_PEOPLE.samOkonkwo.name,
    businessUnit: "Configuration Management",
    implementationStatus: "approved",
    reviewDueDate: null,
    evidenceRequirement: "required",
  },
  {
    controlId: "pl-2",
    owner: DEMO_PEOPLE.priyaSharma.name,
    coOwner: DEMO_PEOPLE.garyMercer.name,
    businessUnit: "Strategic Goose Operations Command",
    implementationStatus: "implemented",
    reviewDueDate: null,
    evidenceRequirement: "optional",
  },
  {
    controlId: "pe-3",
    owner: DEMO_PEOPLE.dougBillings.name,
    coOwner: DEMO_PEOPLE.taylorReid.name,
    businessUnit: "Facilities",
    implementationStatus: "implemented",
    reviewDueDate: "2026-08-30",
    evidenceRequirement: "required",
  },
];

async function ensureControlRecords(input: {
  controlRecords: ReturnType<typeof createPostgresControlRecordService>;
  projectId: string;
  records: readonly UpsertControlRecordInput[];
  actor: ActorIdentity;
}): Promise<number> {
  const existing = await input.controlRecords.listByProject(input.projectId);
  const have = new Set(existing.map((row) => row.controlId));
  let created = 0;
  for (const record of input.records) {
    if (have.has(record.controlId)) {
      continue;
    }
    const result = await input.controlRecords.upsertWithActivity(
      input.projectId,
      record,
      input.actor,
    );
    if (result.created) {
      created += 1;
    }
    have.add(record.controlId);
  }
  return created;
}

type UsersByEmail = Record<string, EnsuredUser>;

/**
 * Populate collaboration and ControlRecord metadata.
 * Idempotent via demo-seed markers and create-if-missing records.
 * Does not overwrite user-edited assignees, comment bodies, or ControlRecords.
 */
export async function ensureDemoCollaboration(input: {
  db: AppDatabase;
  users: UsersByEmail;
  cgdsOrgId: string;
  contosoOrgId: string;
  flagship: StoredProject;
  cmmc: StoredProject;
  early: StoredProject;
  evidenceGap: StoredProject;
  high: StoredProject;
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

  await ensureControlRecords({
    controlRecords,
    projectId: input.flagship.id,
    records: FLAGSHIP_CONTROL_RECORDS,
    actor: actor(bob),
  });

  const ac2Root = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ac-2",
    body: "Dave, can you verify the FeatherAuth account-review evidence before we submit AC-2?",
    marker: "goose-ac-2-root",
    author: carol,
  });
  if (ac2Root.created) commentsCreated += 1;

  const ac2Reply1 = await ensureReply({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ac-2",
    parentCommentId: ac2Root.id,
    body: "@carol Engineering confirmed MFA rollout on Goose Operations Portal yesterday.",
    marker: "goose-ac-2-reply-bob",
    author: bob,
    mentionedUserIds: [carol.id],
  });
  if (ac2Reply1.created) commentsCreated += 1;

  const ac2Reply2 = await ensureReply({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ac-2",
    parentCommentId: ac2Root.id,
    body: "This implementation looks good. Resolving.",
    marker: "goose-ac-2-reply-dave",
    author: dave,
  });
  if (ac2Reply2.created) commentsCreated += 1;

  const ac2Comments = await discussions.listComments(
    input.cgdsOrgId,
    input.flagship.id,
    "ac-2",
    { includeDeleted: true },
  );
  const ac2RootRow = ac2Comments.find((c) => c.id === ac2Root.id);
  if (ac2RootRow && !ac2RootRow.resolved) {
    await discussions.resolveDiscussion(
      input.cgdsOrgId,
      ac2Root.id,
      actor(dave),
    );
  }

  const ia2Root = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ia-2",
    body: "Please ensure this control is complete before Gary's Annual Performance Review.",
    marker: "goose-ia-2-root",
    author: alice,
  });
  if (ia2Root.created) commentsCreated += 1;

  const ia2Reply = await ensureReply({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ia-2",
    parentCommentId: ia2Root.id,
    body: "Working through authenticator policy updates with Olivia this week.",
    marker: "goose-ia-2-reply-carol",
    author: carol,
    mentionedUserIds: [olivia.id],
  });
  if (ia2Reply.created) commentsCreated += 1;

  const au2Trash = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "au-2",
    body: "Draft note — ignore, wrong control context.",
    marker: "goose-au-2-deleted",
    author: olivia,
  });
  if (au2Trash.created) {
    commentsCreated += 1;
    await discussions.softDeleteComment(
      input.cgdsOrgId,
      au2Trash.id,
      actor(olivia),
    );
  }

  const si4 = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "si-4",
    body: "Monitoring coverage looks incomplete for NestWatch sensors — updated after ops review.",
    marker: "goose-si-4-edited",
    author: bob,
  });
  if (si4.created) {
    commentsCreated += 1;
    await discussions.editComment(
      input.cgdsOrgId,
      si4.id,
      `Monitoring coverage looks incomplete for NestWatch sensors — updated after ops review.${demoSeedMarker("goose-si-4-edited")}`,
      actor(bob),
      [dave.id],
    );
  }

  for (const controlId of ["ia-5", "au-6", "sc-7", "cm-2"] as const) {
    const root = await ensureRootComment({
      discussions,
      organizationId: input.cgdsOrgId,
      projectId: input.flagship.id,
      controlId,
      body: `Status check on ${controlId.toUpperCase()}: please confirm owners and evidence path.`,
      marker: `goose-${controlId}-root`,
      author: bob,
    });
    if (root.created) commentsCreated += 1;
    const reply = await ensureReply({
      discussions,
      organizationId: input.cgdsOrgId,
      projectId: input.flagship.id,
      controlId,
      parentCommentId: root.id,
      body: `Acknowledged — ${controlId.toUpperCase()} is on Carol's queue.`,
      marker: `goose-${controlId}-reply`,
      author: carol,
    });
    if (reply.created) commentsCreated += 1;
  }

  const a1 = await ensureAssignment({
    assignments,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ac-2",
    assigneeUserId: carol.id,
    assignmentRole: "owner",
    assignedBy: bob,
  });
  if (a1.created) assignmentsCreated += 1;

  const a2 = await ensureAssignment({
    assignments,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ac-2",
    assigneeUserId: dave.id,
    assignmentRole: "reviewer",
    assignedBy: bob,
    complete: true,
  });
  if (a2.created) assignmentsCreated += 1;

  const a3 = await ensureAssignment({
    assignments,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "ia-2",
    assigneeUserId: olivia.id,
    assignmentRole: "owner",
    assignedBy: alice,
  });
  if (a3.created) {
    assignmentsCreated += 1;
    await assignments.reassign(input.cgdsOrgId, a3.id, carol.id, actor(alice));
  }

  const a4 = await ensureAssignment({
    assignments,
    organizationId: input.cgdsOrgId,
    projectId: input.flagship.id,
    controlId: "si-4",
    assigneeUserId: bob.id,
    assignmentRole: "owner",
    assignedBy: alice,
  });
  if (a4.created) assignmentsCreated += 1;

  await notifications.notify({
    organizationId: input.cgdsOrgId,
    recipientUserId: dave.id,
    actorUserId: carol.id,
    eventType: "comment_mention",
    relatedObjectType: "comment",
    relatedObjectId: `demo-seed:goose-ac-2-mention`,
    projectId: input.flagship.id,
    controlId: "ac-2",
    summary: "You were mentioned on control ac-2",
  });
  const daveNotes = await notifications.listForRecipient(dave.id, {
    limit: 20,
  });
  if (daveNotes[0] && !daveNotes[0].readAt) {
    await notifications.markRead(dave.id, daveNotes[0].id);
  }

  const cmmcRoot = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.cmmc.id,
    controlId: "AC.L2-3.1.1",
    body: "CUI enclave kickoff: confirm authorized-user scope for Border Post 17 before we go further on AC.L2-3.1.1.",
    marker: "cmmc-ac-l2-3.1.1-root",
    author: bob,
  });
  if (cmmcRoot.created) commentsCreated += 1;
  const cmmcAssign = await ensureAssignment({
    assignments,
    organizationId: input.cgdsOrgId,
    projectId: input.cmmc.id,
    controlId: "AC.L2-3.1.1",
    assigneeUserId: carol.id,
    assignmentRole: "owner",
    assignedBy: bob,
  });
  if (cmmcAssign.created) assignmentsCreated += 1;

  void input.early;

  const gapRoot = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.evidenceGap.id,
    controlId: "cm-2",
    body: "CIMS narratives are in good shape, but we still do not have active Evidence for most of this package.",
    marker: "evidence-gap-cm-2-root",
    author: alice,
  });
  if (gapRoot.created) commentsCreated += 1;

  const highRoot = await ensureRootComment({
    discussions,
    organizationId: input.cgdsOrgId,
    projectId: input.high.id,
    controlId: "pl-2",
    body: "High overlay is open. Please keep Moderate narratives where they still apply and leave High-only enhancements unaddressed for now.",
    marker: "high-pl-2-root",
    author: bob,
  });
  if (highRoot.created) commentsCreated += 1;

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
