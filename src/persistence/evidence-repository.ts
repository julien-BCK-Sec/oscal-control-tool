import type {
  CreateEvidenceInput,
  Evidence,
  EvidenceControlLink,
  EvidenceWithControlIds,
  ListEvidenceOptions,
  UpdateEvidenceInput,
} from "@/data/evidence";

/**
 * Persistence boundary for project-scoped Evidence (Milestone 03A).
 * Tenancy is enforced via project ownership in authorized wrappers.
 */
export interface EvidenceRepository {
  create(input: CreateEvidenceInput): Promise<EvidenceWithControlIds>;

  getById(
    projectId: string,
    evidenceId: string,
  ): Promise<EvidenceWithControlIds | null>;

  listByProject(
    projectId: string,
    options?: ListEvidenceOptions,
  ): Promise<EvidenceWithControlIds[]>;

  update(
    projectId: string,
    evidenceId: string,
    input: UpdateEvidenceInput,
  ): Promise<EvidenceWithControlIds | null>;

  delete(projectId: string, evidenceId: string): Promise<boolean>;

  listControlIds(projectId: string, evidenceId: string): Promise<string[]>;

  listLinksForControl(
    projectId: string,
    controlId: string,
  ): Promise<EvidenceControlLink[]>;

  associate(
    projectId: string,
    evidenceId: string,
    controlId: string,
  ): Promise<EvidenceControlLink | null>;

  dissociate(
    projectId: string,
    evidenceId: string,
    controlId: string,
  ): Promise<boolean>;
}

export type { Evidence, EvidenceControlLink };
