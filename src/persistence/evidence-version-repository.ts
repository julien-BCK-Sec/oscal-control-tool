import type {
  EvidenceVersion,
  EvidenceVersionWithStorageKey,
} from "@/data/evidence";

export type CreateEvidenceVersionRecordInput = {
  id: string;
  evidenceId: string;
  projectId: string;
  /** When omitted, next version number is assigned inside the transaction. */
  versionNumber?: number;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  uploadedByUserId: string;
  uploadedAt: string;
};

/**
 * Persistence for immutable Evidence Versions (Milestone 03B).
 * Binary bytes are not stored here — only metadata + opaque storage key.
 */
export interface EvidenceVersionRepository {
  listByEvidence(
    projectId: string,
    evidenceId: string,
  ): Promise<EvidenceVersion[]>;

  getById(
    projectId: string,
    evidenceId: string,
    versionId: string,
  ): Promise<EvidenceVersionWithStorageKey | null>;

  /**
   * Insert version and set evidence.current_version_id in one transaction.
   * Caller must have already written bytes to object storage.
   */
  insertVersionAndSetCurrent(
    input: CreateEvidenceVersionRecordInput,
  ): Promise<EvidenceVersion>;

  /** Storage keys for cleanup when hard-deleting Evidence. */
  listStorageKeys(projectId: string, evidenceId: string): Promise<string[]>;

  /** Next version number (max + 1), or 1 when none exist. */
  nextVersionNumber(projectId: string, evidenceId: string): Promise<number>;
}
