import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  isEvidenceRequirement,
  type ControlRecord,
} from "@/data/control-record";
import { DEFAULT_EVIDENCE_REQUIREMENT } from "@/data/evidence";
import type {
  CreateEvidenceInput,
  EvidenceWithControlIds,
  UpdateEvidenceInput,
} from "@/data/evidence";
import type { AppendControlActivityInput } from "@/data/control-activity";
import type { ActorIdentity } from "../actor";
import { nextActivityTimestamp } from "../activity-clock";
import type {
  EvidenceDeleteResult,
  EvidenceMutationResult,
  EvidenceService,
} from "../evidence-service";
import { appendActivitiesInTransaction } from "./control-activity-repository";
import { createPostgresEvidenceRepository } from "./evidence-repository";
import type { AppDatabase } from "./client";
import { controlRecords, projects } from "./schema";

async function ensureControlRecord(
  db: AppDatabase,
  projectId: string,
  controlId: string,
  actor: ActorIdentity,
): Promise<ControlRecord> {
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!projectRows[0]) {
    throw new Error("Project not found.");
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
    return {
      id: row.id,
      projectId: row.projectId,
      controlId: row.controlId,
      owner: row.owner,
      coOwner: row.coOwner,
      businessUnit: row.businessUnit,
      implementationStatus:
        row.implementationStatus as ControlRecord["implementationStatus"],
      reviewStatus: row.reviewStatus as ControlRecord["reviewStatus"],
      reviewDueDate: row.reviewDueDate,
      evidenceRequirement: isEvidenceRequirement(row.evidenceRequirement)
        ? row.evidenceRequirement
        : DEFAULT_EVIDENCE_REQUIREMENT,
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

function evidenceActivityMeta(
  evidence: EvidenceWithControlIds,
): string {
  return JSON.stringify({
    evidenceId: evidence.id,
    title: evidence.title,
  });
}

async function appendLinkActivities(
  db: AppDatabase,
  projectId: string,
  evidence: EvidenceWithControlIds,
  controlIds: readonly string[],
  activityType: "evidence_added" | "evidence_removed",
  actor: ActorIdentity,
): Promise<EvidenceMutationResult["activities"]> {
  const activities = [];
  for (const controlId of controlIds) {
    const record = await ensureControlRecord(db, projectId, controlId, actor);
    const inputs: AppendControlActivityInput[] = [
      {
        controlRecordId: record.id,
        activityType,
        actorId: actor.actorId,
        actorDisplayName: actor.actorDisplayName,
        newValue: activityType === "evidence_added" ? evidence.title : null,
        previousValue:
          activityType === "evidence_removed" ? evidence.title : null,
        metadataJson: evidenceActivityMeta(evidence),
        createdAt: nextActivityTimestamp(),
      },
    ];
    const [activity] = await appendActivitiesInTransaction(db, inputs);
    activities.push(activity);
  }
  return activities;
}

export function createPostgresEvidenceService(
  db: AppDatabase,
): EvidenceService {
  const repo = createPostgresEvidenceRepository(db);

  return {
    getById(projectId, evidenceId) {
      return repo.getById(projectId, evidenceId);
    },

    listByProject(projectId, options) {
      return repo.listByProject(projectId, options);
    },

    async create(input: CreateEvidenceInput, actor) {
      const evidence = await repo.create(input);
      const activities = await appendLinkActivities(
        db,
        evidence.projectId,
        evidence,
        evidence.controlIds,
        "evidence_added",
        actor,
      );
      return { evidence, activities };
    },

    async update(
      projectId,
      evidenceId,
      input: UpdateEvidenceInput,
      actor,
    ) {
      void actor;
      const evidence = await repo.update(projectId, evidenceId, input);
      if (!evidence) {
        return null;
      }
      // Field updates are captured via domain events; ControlActivity is
      // association-scoped (ADR-024).
      return { evidence, activities: [] };
    },

    async archive(projectId, evidenceId, actor) {
      return this.update(
        projectId,
        evidenceId,
        { status: "archived" },
        actor,
      );
    },

    async deleteDraft(projectId, evidenceId): Promise<EvidenceDeleteResult> {
      const existing = await repo.getById(projectId, evidenceId);
      if (!existing) {
        return {
          ok: false,
          reason: "not-found",
          message: "Evidence not found.",
        };
      }
      if (existing.status !== "draft" || existing.controlIds.length > 0) {
        return {
          ok: false,
          reason: "not-deletable",
          message:
            "Only draft evidence with no control associations may be permanently deleted. Archive instead.",
        };
      }
      const deleted = await repo.delete(projectId, evidenceId);
      if (!deleted) {
        return {
          ok: false,
          reason: "not-found",
          message: "Evidence not found.",
        };
      }
      return { ok: true, deleted: true };
    },

    async associate(projectId, evidenceId, controlId, actor) {
      const before = await repo.getById(projectId, evidenceId);
      if (!before) {
        return null;
      }
      if (before.controlIds.includes(controlId.trim())) {
        return { evidence: before, activities: [] };
      }
      const link = await repo.associate(projectId, evidenceId, controlId);
      if (!link) {
        return null;
      }
      const evidence = await repo.getById(projectId, evidenceId);
      if (!evidence) {
        return null;
      }
      const activities = await appendLinkActivities(
        db,
        projectId,
        evidence,
        [controlId.trim()],
        "evidence_added",
        actor,
      );
      return { evidence, activities };
    },

    async dissociate(projectId, evidenceId, controlId, actor) {
      const before = await repo.getById(projectId, evidenceId);
      if (!before) {
        return null;
      }
      const trimmed = controlId.trim();
      if (!before.controlIds.includes(trimmed)) {
        return { evidence: before, activities: [] };
      }
      await repo.dissociate(projectId, evidenceId, trimmed);
      const activities = await appendLinkActivities(
        db,
        projectId,
        before,
        [trimmed],
        "evidence_removed",
        actor,
      );
      const evidence = await repo.getById(projectId, evidenceId);
      if (!evidence) {
        return null;
      }
      return { evidence, activities };
    },
  };
}
