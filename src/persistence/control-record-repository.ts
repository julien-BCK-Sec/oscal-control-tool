import type {
  ControlRecord,
  UpsertControlRecordInput,
} from "@/data/control-record";

/**
 * Persistence boundary for ControlRecord rows.
 * UI must not call Drizzle/SQLite directly.
 */
export interface ControlRecordRepository {
  listByProject(projectId: string): Promise<ControlRecord[]>;
  getByProjectAndControl(
    projectId: string,
    controlId: string,
  ): Promise<ControlRecord | null>;
  upsert(
    projectId: string,
    input: UpsertControlRecordInput,
  ): Promise<ControlRecord>;
  upsertMany(
    projectId: string,
    inputs: UpsertControlRecordInput[],
  ): Promise<ControlRecord[]>;
}
