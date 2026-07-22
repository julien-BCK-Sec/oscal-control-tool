import type { ControlReviewStatus } from "@/data/control-record";
import type { ControlActivityTypeSupported } from "@/data/control-activity";

/** Named review workflow actions — UI and APIs use these, not raw status writes. */
export type ControlReviewAction =
  | "submit_for_review"
  | "start_review"
  | "approve_review"
  | "request_changes"
  | "resubmit_for_review"
  | "reopen_review";

export type ControlReviewActivityType = Extract<
  ControlActivityTypeSupported,
  | "review_requested"
  | "review_started"
  | "review_approved"
  | "changes_requested"
  | "review_resubmitted"
  | "review_reopened"
>;

export type ControlReviewTransition = {
  action: ControlReviewAction;
  from: ControlReviewStatus;
  to: ControlReviewStatus;
  activityType: ControlReviewActivityType;
  label: string;
};
