import type {
  EvidenceInventoryRow,
  ProjectEvidenceCoverageResult,
} from "@/data/evidence";

export type EvidenceInventoryQueryRow = Omit<EvidenceInventoryRow, "projectName">;

export type EvidenceInventoryQueryResult = {
  asOfDate: string;
  rows: EvidenceInventoryQueryRow[];
};

/**
 * Read/query boundary for Evidence coverage and inventory (Milestone 03D).
 * Not an aggregate. Does not mutate Evidence or ControlRecords.
 */
export interface EvidenceCoverageQuery {
  getProjectCoverage(input: {
    projectId: string;
    controlIds: readonly string[];
    asOfDate: string;
  }): Promise<ProjectEvidenceCoverageResult>;

  getInventory(input: {
    projectId: string;
    controlIds: readonly string[];
    asOfDate: string;
  }): Promise<EvidenceInventoryQueryResult>;
}
