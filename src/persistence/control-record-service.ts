import type { ActorIdentity } from "./actor";
import type { ControlActivity } from "@/data/control-activity";
import type { ControlReviewAction } from "@/data/control-review";
import type {
  ControlRecord,
  ControlReviewStatus,
  UpsertControlRecordInput,
} from "@/data/control-record";

export type UpsertControlRecordWithActivityResult = {
  record: ControlRecord;
  /** True when the row or any activity was written. */
  changed: boolean;
  /** True when this call inserted a new ControlRecord row. */
  created: boolean;
  activityCount: number;
};

export type TransitionReviewStatusInput = {
  projectId: string;
  controlId: string;
  action: ControlReviewAction;
  expectedCurrentStatus: ControlReviewStatus;
};

export type TransitionReviewStatusResult =
  | {
      ok: true;
      record: ControlRecord;
      activity: ControlActivity;
      /** True when a ControlRecord row was created in this call. */
      created: boolean;
    }
  | {
      ok: false;
      reason: "conflict";
      message: string;
      currentReviewStatus: ControlReviewStatus;
    }
  | {
      ok: false;
      reason: "invalid-transition";
      message: string;
      currentReviewStatus: ControlReviewStatus;
    }
  | {
      ok: false;
      reason: "not-found";
      message: string;
    };

export type ControlReviewStatusCounts = Record<ControlReviewStatus, number>;

export type ControlReviewQuerySummary = {
  counts: ControlReviewStatusCounts;
  overdue: ControlRecord[];
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
  /**
   * Apply a legal review workflow transition. Does not accept arbitrary
   * reviewStatus assignment. Uses expectedCurrentStatus for concurrency.
   */
  transitionReviewStatus(
    input: TransitionReviewStatusInput,
    actor: ActorIdentity,
  ): Promise<TransitionReviewStatusResult>;
  listByReviewStatus(
    projectId: string,
    reviewStatus: ControlReviewStatus,
  ): Promise<ControlRecord[]>;
  /**
   * Counts by reviewStatus. When `allControlIds` is provided, controls without
   * a persisted row are counted as not_reviewed.
   */
  countByReviewStatus(
    projectId: string,
    allControlIds?: readonly string[],
  ): Promise<ControlReviewStatusCounts>;
  listOverdueForReview(
    projectId: string,
    asOfDate?: string,
  ): Promise<ControlRecord[]>;
  summarizeReviewStatuses(
    projectId: string,
    allControlIds: readonly string[],
    asOfDate?: string,
  ): Promise<ControlReviewQuerySummary>;
}
