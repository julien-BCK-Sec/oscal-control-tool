import type { ActorIdentity } from "./actor";
import type {
  CreateEvidenceInput,
  Evidence,
  EvidenceWithControlIds,
  ListEvidenceOptions,
  UpdateEvidenceInput,
} from "@/data/evidence";
import type { ControlActivity } from "@/data/control-activity";

export type EvidenceMutationResult = {
  evidence: EvidenceWithControlIds;
  activities: ControlActivity[];
};

export type EvidenceDeleteResult =
  | { ok: true; deleted: true }
  | {
      ok: false;
      reason: "not-found" | "not-deletable";
      message: string;
    };

/**
 * Coordinates Evidence CRUD, control associations, and ControlActivity
 * fan-out for link/unlink (Milestone 03A, ADR-024).
 */
export interface EvidenceService {
  getById(
    projectId: string,
    evidenceId: string,
  ): Promise<EvidenceWithControlIds | null>;

  listByProject(
    projectId: string,
    options?: ListEvidenceOptions,
  ): Promise<EvidenceWithControlIds[]>;

  create(
    input: CreateEvidenceInput,
    actor: ActorIdentity,
  ): Promise<EvidenceMutationResult>;

  update(
    projectId: string,
    evidenceId: string,
    input: UpdateEvidenceInput,
    actor: ActorIdentity,
  ): Promise<EvidenceMutationResult | null>;

  archive(
    projectId: string,
    evidenceId: string,
    actor: ActorIdentity,
  ): Promise<EvidenceMutationResult | null>;

  /**
   * Hard-delete only when status is draft, never left draft, and has no
   * control associations.
   */
  deleteDraft(
    projectId: string,
    evidenceId: string,
  ): Promise<EvidenceDeleteResult>;

  associate(
    projectId: string,
    evidenceId: string,
    controlId: string,
    actor: ActorIdentity,
  ): Promise<EvidenceMutationResult | null>;

  dissociate(
    projectId: string,
    evidenceId: string,
    controlId: string,
    actor: ActorIdentity,
  ): Promise<EvidenceMutationResult | null>;
}

export type { Evidence };
