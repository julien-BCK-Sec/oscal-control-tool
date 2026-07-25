import type { ActorIdentity } from "./actor";
import type {
  CreateEvidenceInput,
  Evidence,
  EvidenceWithControlIds,
  ListEvidenceOptions,
  SearchEvidenceInput,
  SearchEvidencePage,
  UpdateEvidenceInput,
} from "@/data/evidence";
import type { ControlActivity } from "@/data/control-activity";

export type EvidenceMutationResult = {
  evidence: EvidenceWithControlIds;
  activities: ControlActivity[];
};

export type EvidenceDeleteResult =
  | { ok: true; deleted: true; storageKeys: string[] }
  | {
      ok: false;
      reason: "not-found" | "not-deletable";
      message: string;
    };

export type EvidenceAssociateResult =
  | { ok: true; evidence: EvidenceWithControlIds; activities: ControlActivity[] }
  | {
      ok: false;
      reason: "not-found" | "archived";
      message: string;
    };

/**
 * Coordinates Evidence CRUD, control associations, and ControlActivity
 * fan-out for link/unlink (Milestone 03A/03C, ADR-024).
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

  search(input: SearchEvidenceInput): Promise<SearchEvidencePage>;

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

  /**
   * Link Evidence to a control. Idempotent when already linked.
   * Rejects new associations when Evidence is archived.
   */
  associate(
    projectId: string,
    evidenceId: string,
    controlId: string,
    actor: ActorIdentity,
  ): Promise<EvidenceAssociateResult>;

  dissociate(
    projectId: string,
    evidenceId: string,
    controlId: string,
    actor: ActorIdentity,
  ): Promise<EvidenceMutationResult | null>;
}

export type { Evidence };
