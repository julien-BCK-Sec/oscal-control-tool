import "server-only";

import { eq } from "drizzle-orm";
import {
  buildControlEvidenceCoverage,
  deriveEvidenceFreshness,
  isEvidenceRequirement,
  isEvidenceStatus,
  isEvidenceType,
  resolveEvidenceRequirement,
  summarizeProjectEvidenceCoverage,
  type EvidenceRequirement,
  type EvidenceStatus,
  type EvidenceType,
  type LinkedEvidenceFacts,
  type ProjectEvidenceCoverageResult,
} from "@/data/evidence";
import type {
  EvidenceCoverageQuery,
  EvidenceInventoryQueryResult,
} from "../evidence-coverage-query";
import type { AppDatabase } from "./client";
import { controlRecords, evidence, evidenceControls, evidenceVersions } from "./schema";

export function createPostgresEvidenceCoverageQuery(
  db: AppDatabase,
): EvidenceCoverageQuery {
  return {
    async getProjectCoverage(input): Promise<ProjectEvidenceCoverageResult> {
      const projectId = input.projectId.trim();
      const asOfDate = input.asOfDate;
      const controlIds = [...new Set(input.controlIds.map((id) => id.trim()).filter(Boolean))];

      const [recordRows, evidenceRows, linkRows] = await Promise.all([
        db
          .select({
            controlId: controlRecords.controlId,
            evidenceRequirement: controlRecords.evidenceRequirement,
          })
          .from(controlRecords)
          .where(eq(controlRecords.projectId, projectId)),
        db
          .select({
            id: evidence.id,
            status: evidence.status,
            reviewDueDate: evidence.reviewDueDate,
            currentVersionId: evidence.currentVersionId,
          })
          .from(evidence)
          .where(eq(evidence.projectId, projectId)),
        db
          .select({
            evidenceId: evidenceControls.evidenceId,
            controlId: evidenceControls.controlId,
          })
          .from(evidenceControls)
          .where(eq(evidenceControls.projectId, projectId)),
      ]);

      const requirementByControl = new Map<string, EvidenceRequirement>();
      for (const row of recordRows) {
        requirementByControl.set(
          row.controlId,
          isEvidenceRequirement(row.evidenceRequirement)
            ? row.evidenceRequirement
            : resolveEvidenceRequirement(null),
        );
      }

      const evidenceById = new Map(
        evidenceRows.map((row) => {
          const status: EvidenceStatus = isEvidenceStatus(row.status)
            ? row.status
            : "draft";
          return [
            row.id,
            {
              status,
              hasCurrentVersion: row.currentVersionId !== null,
              freshness: deriveEvidenceFreshness(row.reviewDueDate, asOfDate),
            },
          ] as const;
        }),
      );

      const linksByControl = new Map<string, LinkedEvidenceFacts[]>();
      const linkedEvidenceIds = new Set<string>();
      for (const link of linkRows) {
        const item = evidenceById.get(link.evidenceId);
        if (!item) {
          continue;
        }
        linkedEvidenceIds.add(link.evidenceId);
        const list = linksByControl.get(link.controlId) ?? [];
        list.push(item);
        linksByControl.set(link.controlId, list);
      }

      const controls = controlIds.map((controlId) =>
        buildControlEvidenceCoverage({
          projectId,
          controlId,
          evidenceRequirement: resolveEvidenceRequirement(
            requirementByControl.get(controlId),
          ),
          linked: linksByControl.get(controlId) ?? [],
        }),
      );

      let dueSoonEvidence = 0;
      let overdueEvidence = 0;
      let unlinkedEvidence = 0;
      let archivedEvidence = 0;
      let draftEvidence = 0;
      for (const item of evidenceById.values()) {
        if (item.status === "archived") {
          archivedEvidence += 1;
          continue;
        }
        if (item.status === "draft") {
          draftEvidence += 1;
        }
        if (item.freshness === "due_soon") {
          dueSoonEvidence += 1;
        } else if (item.freshness === "overdue") {
          overdueEvidence += 1;
        }
      }
      for (const [id, item] of evidenceById) {
        if (item.status === "archived") {
          continue;
        }
        if (!linkedEvidenceIds.has(id)) {
          unlinkedEvidence += 1;
        }
      }

      const summary = summarizeProjectEvidenceCoverage({
        asOfDate,
        controls,
        dueSoonEvidence,
        overdueEvidence,
        unlinkedEvidence,
        archivedEvidence,
        draftEvidence,
      });

      return { asOfDate, summary, controls };
    },

    async getInventory(input): Promise<EvidenceInventoryQueryResult> {
      const projectId = input.projectId.trim();
      const asOfDate = input.asOfDate;

      const [recordRows, evidenceRows, linkRows] = await Promise.all([
        db
          .select({
            controlId: controlRecords.controlId,
            evidenceRequirement: controlRecords.evidenceRequirement,
          })
          .from(controlRecords)
          .where(eq(controlRecords.projectId, projectId)),
        db
          .select({
            id: evidence.id,
            title: evidence.title,
            evidenceType: evidence.evidenceType,
            owner: evidence.owner,
            status: evidence.status,
            collectionDate: evidence.collectionDate,
            reviewDueDate: evidence.reviewDueDate,
            versionFilename: evidenceVersions.originalFilename,
            versionUploadedAt: evidenceVersions.uploadedAt,
          })
          .from(evidence)
          .leftJoin(
            evidenceVersions,
            eq(evidence.currentVersionId, evidenceVersions.id),
          )
          .where(eq(evidence.projectId, projectId)),
        db
          .select({
            evidenceId: evidenceControls.evidenceId,
            controlId: evidenceControls.controlId,
          })
          .from(evidenceControls)
          .where(eq(evidenceControls.projectId, projectId)),
      ]);

      const requirementByControl = new Map<string, EvidenceRequirement>();
      for (const row of recordRows) {
        requirementByControl.set(
          row.controlId,
          isEvidenceRequirement(row.evidenceRequirement)
            ? row.evidenceRequirement
            : resolveEvidenceRequirement(null),
        );
      }

      const linksByEvidence = new Map<string, string[]>();
      for (const link of linkRows) {
        const list = linksByEvidence.get(link.evidenceId) ?? [];
        list.push(link.controlId);
        linksByEvidence.set(link.evidenceId, list);
      }

      const rows: EvidenceInventoryQueryResult["rows"] = [];
      for (const row of evidenceRows) {
        const status: EvidenceStatus = isEvidenceStatus(row.status)
          ? row.status
          : "draft";
        const evidenceType: EvidenceType = isEvidenceType(row.evidenceType)
          ? row.evidenceType
          : "other";
        const freshness = deriveEvidenceFreshness(row.reviewDueDate, asOfDate);
        const controlIds = linksByEvidence.get(row.id) ?? [];
        const linkedControlCount = controlIds.length;
        const base = {
          projectId,
          evidenceId: row.id,
          title: row.title,
          evidenceType,
          owner: row.owner,
          status,
          collectionDate: row.collectionDate,
          reviewDueDate: row.reviewDueDate,
          freshness,
          currentVersionFilename: row.versionFilename ?? null,
          currentVersionUploadedAt: row.versionUploadedAt ?? null,
          linkedControlCount,
        };
        if (controlIds.length === 0) {
          rows.push({
            ...base,
            controlId: null,
            evidenceRequirement: null,
          });
          continue;
        }
        for (const controlId of controlIds) {
          rows.push({
            ...base,
            controlId,
            evidenceRequirement: resolveEvidenceRequirement(
              requirementByControl.get(controlId),
            ),
          });
        }
      }

      rows.sort((a, b) => {
        const titleCmp = a.title.localeCompare(b.title);
        if (titleCmp !== 0) {
          return titleCmp;
        }
        return (a.controlId ?? "").localeCompare(b.controlId ?? "");
      });

      return { asOfDate, rows };
    },
  };
}
