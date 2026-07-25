import { randomUUID } from "node:crypto";

/**
 * Build an opaque storage key for an Evidence Version binary.
 * Keys are never exposed outside the storage / persistence layers.
 */
export function createEvidenceStorageKey(input: {
  projectId: string;
  evidenceId: string;
  versionId: string;
}): string {
  // UUID segment avoids predictability; project/evidence segments aid ops
  // isolation without encoding filesystem paths for clients.
  const nonce = randomUUID();
  return `evidence/${input.projectId}/${input.evidenceId}/${input.versionId}/${nonce}`;
}
