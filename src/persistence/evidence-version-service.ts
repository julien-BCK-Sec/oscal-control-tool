import type { ActorIdentity } from "./actor";
import type {
  EvidenceVersion,
  EvidenceVersionWithStorageKey,
  EvidenceWithControlIds,
  ValidatedUpload,
} from "@/data/evidence";
import type { ObjectStorageProvider } from "@/storage";

export type EvidenceVersionUploadResult =
  | {
      ok: true;
      version: EvidenceVersion;
      evidence: EvidenceWithControlIds;
    }
  | {
      ok: false;
      reason: "not-found" | "validation" | "storage";
      message: string;
    };

export type EvidenceVersionDownloadResult =
  | {
      ok: true;
      version: EvidenceVersionWithStorageKey;
      body: Buffer;
      contentType: string;
    }
  | {
      ok: false;
      reason: "not-found" | "storage";
      message: string;
    };

/**
 * Coordinates Evidence Version upload/download with object storage (ADR-025).
 */
export interface EvidenceVersionService {
  listVersions(
    projectId: string,
    evidenceId: string,
  ): Promise<EvidenceVersion[]>;

  getVersion(
    projectId: string,
    evidenceId: string,
    versionId: string,
  ): Promise<EvidenceVersion | null>;

  uploadVersion(
    input: {
      projectId: string;
      evidenceId: string;
      upload: ValidatedUpload;
      uploadedByUserId: string;
    },
    actor: ActorIdentity,
  ): Promise<EvidenceVersionUploadResult>;

  downloadVersion(
    projectId: string,
    evidenceId: string,
    versionId: string,
  ): Promise<EvidenceVersionDownloadResult>;

  /**
   * Best-effort delete of all storage objects for an Evidence record.
   * Used after hard-delete of draft Evidence.
   */
  cleanupStorageForEvidence(
    projectId: string,
    evidenceId: string,
    storageKeys: readonly string[],
  ): Promise<void>;
}

export type EvidenceVersionServiceDeps = {
  storage: ObjectStorageProvider;
};
