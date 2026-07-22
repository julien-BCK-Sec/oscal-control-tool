import type { ActorIdentity } from "./actor";
import type {
  ControlRecord,
  UpsertControlRecordInput,
} from "@/data/control-record";

export type UpsertControlRecordWithActivityResult = {
  record: ControlRecord;
  /** True when the row or any activity was written. */
  changed: boolean;
  activityCount: number;
};

/**
 * Coordinates ControlRecord writes with ControlActivity appends.
 * Keeps change detection and transaction boundaries out of the UI.
 */
export interface ControlRecordService {
  listByProject(projectId: string): Promise<ControlRecord[]>;
  upsertWithActivity(
    projectId: string,
    input: UpsertControlRecordInput,
    actor: ActorIdentity,
  ): Promise<UpsertControlRecordWithActivityResult>;
  upsertManyWithActivity(
    projectId: string,
    inputs: UpsertControlRecordInput[],
    actor: ActorIdentity,
  ): Promise<UpsertControlRecordWithActivityResult[]>;
}
