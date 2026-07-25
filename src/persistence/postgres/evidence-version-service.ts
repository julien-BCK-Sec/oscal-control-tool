import "server-only";

import { randomUUID } from "node:crypto";
import type { ActorIdentity } from "../actor";
import type {
  EvidenceVersionService,
  EvidenceVersionUploadResult,
} from "../evidence-version-service";
import { createPostgresEvidenceRepository } from "./evidence-repository";
import { createPostgresEvidenceVersionRepository } from "./evidence-version-repository";
import type { AppDatabase } from "./client";
import type { ObjectStorageProvider } from "@/storage";
import { createEvidenceStorageKey } from "@/storage";

function logOrphanCleanupFailure(
  storageKey: string,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      level: "error",
      event: "evidence_storage_orphan_cleanup_failed",
      storageKey,
      message,
    }),
  );
}

export function createPostgresEvidenceVersionService(
  db: AppDatabase,
  storage: ObjectStorageProvider,
): EvidenceVersionService {
  const evidenceRepo = createPostgresEvidenceRepository(db);
  const versionRepo = createPostgresEvidenceVersionRepository(db);

  return {
    listVersions(projectId, evidenceId) {
      return versionRepo.listByEvidence(projectId, evidenceId);
    },

    async getVersion(projectId, evidenceId, versionId) {
      const row = await versionRepo.getById(projectId, evidenceId, versionId);
      if (!row) {
        return null;
      }
      const { storageKey: _storageKey, ...view } = row;
      void _storageKey;
      return view;
    },

    async uploadVersion(input, _actor: ActorIdentity): Promise<EvidenceVersionUploadResult> {
      void _actor;
      const existing = await evidenceRepo.getById(
        input.projectId,
        input.evidenceId,
      );
      if (!existing) {
        return {
          ok: false,
          reason: "not-found",
          message: "Evidence not found.",
        };
      }

      const versionId = randomUUID();
      const storageKey = createEvidenceStorageKey({
        projectId: input.projectId,
        evidenceId: input.evidenceId,
        versionId,
      });
      const uploadedAt = new Date().toISOString();

      try {
        await storage.put({
          key: storageKey,
          body: input.upload.body,
          contentType: input.upload.mimeType,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Storage write failed.";
        return { ok: false, reason: "storage", message };
      }

      try {
        const version = await versionRepo.insertVersionAndSetCurrent({
          id: versionId,
          evidenceId: input.evidenceId,
          projectId: input.projectId,
          originalFilename: input.upload.filename,
          storageKey,
          mimeType: input.upload.mimeType,
          sizeBytes: input.upload.sizeBytes,
          sha256: input.upload.sha256,
          uploadedByUserId: input.uploadedByUserId,
          uploadedAt,
        });
        const evidence = await evidenceRepo.getById(
          input.projectId,
          input.evidenceId,
        );
        if (!evidence) {
          return {
            ok: false,
            reason: "not-found",
            message: "Evidence not found after upload.",
          };
        }
        return { ok: true, version, evidence };
      } catch (error) {
        try {
          await storage.delete(storageKey);
        } catch (cleanupError) {
          logOrphanCleanupFailure(storageKey, cleanupError);
        }
        const message =
          error instanceof Error ? error.message : "Failed to persist version.";
        return { ok: false, reason: "storage", message };
      }
    },

    async downloadVersion(projectId, evidenceId, versionId) {
      const version = await versionRepo.getById(
        projectId,
        evidenceId,
        versionId,
      );
      if (!version) {
        return {
          ok: false,
          reason: "not-found",
          message: "Evidence version not found.",
        };
      }
      try {
        const object = await storage.get(version.storageKey);
        if (!object) {
          return {
            ok: false,
            reason: "storage",
            message: "Stored artifact is missing.",
          };
        }
        return {
          ok: true,
          version,
          body: object.body,
          contentType: object.contentType || version.mimeType,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Storage read failed.";
        return { ok: false, reason: "storage", message };
      }
    },

    async cleanupStorageForEvidence(_projectId, _evidenceId, storageKeys) {
      void _projectId;
      void _evidenceId;
      for (const key of storageKeys) {
        try {
          await storage.delete(key);
        } catch (error) {
          logOrphanCleanupFailure(key, error);
        }
      }
    },
  };
}
