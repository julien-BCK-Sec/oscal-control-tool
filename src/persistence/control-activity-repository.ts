import type {
  AppendControlActivityInput,
  ControlActivity,
} from "@/data/control-activity";

/**
 * Append-only activity stream. No update/delete on the normal API.
 */
export interface ControlActivityRepository {
  append(input: AppendControlActivityInput): Promise<ControlActivity>;
  appendMany(inputs: AppendControlActivityInput[]): Promise<ControlActivity[]>;
  listByControlRecordId(controlRecordId: string): Promise<ControlActivity[]>;
}
