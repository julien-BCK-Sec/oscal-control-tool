import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  isControlImplementationStatus,
  isControlReviewStatus,
  isEvidenceRequirement,
  type ControlRecord,
} from "@/data/control-record";
import { DEFAULT_EVIDENCE_REQUIREMENT } from "@/data/evidence";
import type { ActorIdentity } from "../actor";
import { nextActivityTimestamp } from "../activity-clock";
import type { AssignmentService } from "../assignment-service";
import { createPostgresAssignmentRepository } from "./assignment-repository";
import { appendActivitiesInTransaction } from "./control-activity-repository";
import type { AppDatabase } from "./client";
import { controlRecords, projects } from "./schema";

async function ensureControlRecord(
  db: AppDatabase,
  organizationId: string,
  projectId: string,
  controlId: string,
  actor: ActorIdentity,
): Promise<ControlRecord> {
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!projectRows[0]) {
    throw new Error("Project not found in organization.");
  }

  const existing = await db
    .select()
    .from(controlRecords)
    .where(
      and(
        eq(controlRecords.projectId, projectId),
        eq(controlRecords.controlId, controlId),
      ),
    )
    .limit(1);
  if (existing[0]) {
    const row = existing[0];
    const implementationStatus = isControlImplementationStatus(
      row.implementationStatus,
    )
      ? row.implementationStatus
      : "draft";
    const reviewStatus = isControlReviewStatus(row.reviewStatus)
      ? row.reviewStatus
      : DEFAULT_CONTROL_REVIEW_STATUS;
    const evidenceRequirement = isEvidenceRequirement(row.evidenceRequirement)
      ? row.evidenceRequirement
      : DEFAULT_EVIDENCE_REQUIREMENT;
    return {
      id: row.id,
      projectId: row.projectId,
      controlId: row.controlId,
      owner: row.owner,
      coOwner: row.coOwner,
      businessUnit: row.businessUnit,
      implementationStatus,
      reviewStatus,
      reviewDueDate: row.reviewDueDate,
      evidenceRequirement,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  const id = randomUUID();
  const createdAt = nextActivityTimestamp();
  const fields = DEFAULT_CONTROL_RECORD_FIELDS;
  await db.insert(controlRecords).values({
    id,
    projectId,
    controlId,
    owner: fields.owner,
    coOwner: fields.coOwner,
    businessUnit: fields.businessUnit,
    implementationStatus: fields.implementationStatus,
    reviewStatus: DEFAULT_CONTROL_REVIEW_STATUS,
    reviewDueDate: fields.reviewDueDate,
    evidenceRequirement: fields.evidenceRequirement,
    createdAt,
    updatedAt: createdAt,
  });
  await appendActivitiesInTransaction(db, [
    {
      controlRecordId: id,
      activityType: "control_record_created",
      actorId: actor.actorId,
      actorDisplayName: actor.actorDisplayName,
      createdAt,
    },
  ]);
  return {
    id,
    projectId,
    controlId,
    ...fields,
    reviewStatus: DEFAULT_CONTROL_REVIEW_STATUS,
    createdAt,
    updatedAt: createdAt,
  };
}

export function createPostgresAssignmentService(
  db: AppDatabase,
): AssignmentService {
  const assignments = createPostgresAssignmentRepository(db);

  return {
    listByControl(organizationId, projectId, controlId) {
      return assignments.listByControl(organizationId, projectId, controlId);
    },

    getById(organizationId, assignmentId) {
      return assignments.getById(organizationId, assignmentId);
    },

    async assign(input, actor) {
      const assignment = await assignments.create(input);
      const record = await ensureControlRecord(
        db,
        input.organizationId,
        input.projectId,
        input.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "assignment_changed",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          fieldName: assignment.assignmentRole,
          newValue: assignment.assigneeUserId,
          metadataJson: JSON.stringify({ assignmentId: assignment.id }),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { assignment, activity };
    },

    async reassign(organizationId, assignmentId, assigneeUserId, actor) {
      const existing = await assignments.getById(organizationId, assignmentId);
      if (!existing) {
        return null;
      }
      const assignment = await assignments.reassign(
        organizationId,
        assignmentId,
        assigneeUserId,
        actor.actorId ?? existing.assignedByUserId,
      );
      if (!assignment) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        assignment.projectId,
        assignment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "assignment_changed",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          fieldName: assignment.assignmentRole,
          previousValue: existing.assigneeUserId,
          newValue: assignment.assigneeUserId,
          metadataJson: JSON.stringify({ assignmentId: assignment.id }),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { assignment, activity };
    },

    async complete(organizationId, assignmentId, actor) {
      const assignment = await assignments.complete(
        organizationId,
        assignmentId,
      );
      if (!assignment) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        assignment.projectId,
        assignment.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "assignment_completed",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          fieldName: assignment.assignmentRole,
          newValue: assignment.assigneeUserId,
          metadataJson: JSON.stringify({ assignmentId: assignment.id }),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { assignment, activity };
    },

    async remove(organizationId, assignmentId, actor) {
      const existing = await assignments.getById(organizationId, assignmentId);
      if (!existing) {
        return null;
      }
      const removed = await assignments.remove(organizationId, assignmentId);
      if (!removed) {
        return null;
      }
      const record = await ensureControlRecord(
        db,
        organizationId,
        existing.projectId,
        existing.controlId,
        actor,
      );
      const [activity] = await appendActivitiesInTransaction(db, [
        {
          controlRecordId: record.id,
          activityType: "assignment_removed",
          actorId: actor.actorId,
          actorDisplayName: actor.actorDisplayName,
          fieldName: existing.assignmentRole,
          previousValue: existing.assigneeUserId,
          metadataJson: JSON.stringify({ assignmentId: existing.id }),
          createdAt: nextActivityTimestamp(),
        },
      ]);
      return { assignment: existing, activity };
    },
  };
}
