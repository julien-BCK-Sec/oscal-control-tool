import "server-only";

import { and, asc, desc, eq, max } from "drizzle-orm";
import type {
  EvidenceVersion,
  EvidenceVersionWithStorageKey,
} from "@/data/evidence";
import type {
  CreateEvidenceVersionRecordInput,
  EvidenceVersionRepository,
} from "../evidence-version-repository";
import type { AppDatabase } from "./client";
import { evidence, evidenceVersions } from "./schema";

function toVersion(
  row: typeof evidenceVersions.$inferSelect,
): EvidenceVersionWithStorageKey {
  return {
    id: row.id,
    evidenceId: row.evidenceId,
    projectId: row.projectId,
    versionNumber: row.versionNumber,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    sha256: row.sha256,
    uploadedByUserId: row.uploadedByUserId,
    uploadedAt: row.uploadedAt,
    storageKey: row.storageKey,
  };
}

function withoutStorageKey(
  row: EvidenceVersionWithStorageKey,
): EvidenceVersion {
  const { storageKey: _storageKey, ...rest } = row;
  void _storageKey;
  return rest;
}

export function createPostgresEvidenceVersionRepository(
  db: AppDatabase,
): EvidenceVersionRepository {
  return {
    async listByEvidence(projectId, evidenceId) {
      const rows = await db
        .select()
        .from(evidenceVersions)
        .where(
          and(
            eq(evidenceVersions.projectId, projectId),
            eq(evidenceVersions.evidenceId, evidenceId),
          ),
        )
        .orderBy(desc(evidenceVersions.versionNumber));
      return rows.map((row) => withoutStorageKey(toVersion(row)));
    },

    async getById(projectId, evidenceId, versionId) {
      const rows = await db
        .select()
        .from(evidenceVersions)
        .where(
          and(
            eq(evidenceVersions.projectId, projectId),
            eq(evidenceVersions.evidenceId, evidenceId),
            eq(evidenceVersions.id, versionId),
          ),
        )
        .limit(1);
      if (!rows[0]) {
        return null;
      }
      return toVersion(rows[0]);
    },

    async nextVersionNumber(projectId, evidenceId) {
      const rows = await db
        .select({ maxVersion: max(evidenceVersions.versionNumber) })
        .from(evidenceVersions)
        .where(
          and(
            eq(evidenceVersions.projectId, projectId),
            eq(evidenceVersions.evidenceId, evidenceId),
          ),
        );
      const current = rows[0]?.maxVersion;
      return (typeof current === "number" ? current : 0) + 1;
    },

    async listStorageKeys(projectId, evidenceId) {
      const rows = await db
        .select({ storageKey: evidenceVersions.storageKey })
        .from(evidenceVersions)
        .where(
          and(
            eq(evidenceVersions.projectId, projectId),
            eq(evidenceVersions.evidenceId, evidenceId),
          ),
        )
        .orderBy(asc(evidenceVersions.versionNumber));
      return rows.map((row) => row.storageKey);
    },

    async insertVersionAndSetCurrent(input: CreateEvidenceVersionRecordInput) {
      const version = await db.transaction(async (tx) => {
        const parent = await tx
          .select({ id: evidence.id })
          .from(evidence)
          .where(
            and(
              eq(evidence.projectId, input.projectId),
              eq(evidence.id, input.evidenceId),
            ),
          )
          .limit(1);
        if (!parent[0]) {
          throw new Error("Evidence not found.");
        }

        let versionNumber = input.versionNumber;
        if (versionNumber === undefined) {
          const rows = await tx
            .select({ maxVersion: max(evidenceVersions.versionNumber) })
            .from(evidenceVersions)
            .where(
              and(
                eq(evidenceVersions.projectId, input.projectId),
                eq(evidenceVersions.evidenceId, input.evidenceId),
              ),
            );
          const current = rows[0]?.maxVersion;
          versionNumber = (typeof current === "number" ? current : 0) + 1;
        }

        await tx.insert(evidenceVersions).values({
          id: input.id,
          evidenceId: input.evidenceId,
          projectId: input.projectId,
          versionNumber,
          originalFilename: input.originalFilename,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          sha256: input.sha256,
          uploadedByUserId: input.uploadedByUserId,
          uploadedAt: input.uploadedAt,
        });

        await tx
          .update(evidence)
          .set({
            currentVersionId: input.id,
            updatedAt: input.uploadedAt,
          })
          .where(
            and(
              eq(evidence.projectId, input.projectId),
              eq(evidence.id, input.evidenceId),
            ),
          );

        return {
          id: input.id,
          evidenceId: input.evidenceId,
          projectId: input.projectId,
          versionNumber,
          originalFilename: input.originalFilename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          sha256: input.sha256,
          uploadedByUserId: input.uploadedByUserId,
          uploadedAt: input.uploadedAt,
        };
      });

      return version;
    },
  };
}
