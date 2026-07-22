import type { ActorIdentity } from "./actor";
import type { Comment } from "@/data/collaboration";
import type { ControlActivity } from "@/data/control-activity";

export type DiscussionCommentResult = {
  comment: Comment;
  activity: ControlActivity;
  mentionedUserIds: string[];
};

/**
 * Coordinates threaded discussions with ControlActivity audit events.
 * Mentions are persisted when callers supply resolved org member user ids.
 */
export interface DiscussionService {
  listComments(
    organizationId: string,
    projectId: string,
    controlId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<Comment[]>;

  getComment(
    organizationId: string,
    commentId: string,
  ): Promise<Comment | null>;

  createComment(
    input: {
      organizationId: string;
      projectId: string;
      controlId: string;
      parentCommentId?: string | null;
      body: string;
      mentionedUserIds?: readonly string[];
    },
    actor: ActorIdentity,
  ): Promise<DiscussionCommentResult>;

  editComment(
    organizationId: string,
    commentId: string,
    body: string,
    actor: ActorIdentity,
    mentionedUserIds?: readonly string[],
  ): Promise<DiscussionCommentResult | null>;

  softDeleteComment(
    organizationId: string,
    commentId: string,
    actor: ActorIdentity,
  ): Promise<DiscussionCommentResult | null>;

  restoreComment(
    organizationId: string,
    commentId: string,
    actor: ActorIdentity,
  ): Promise<DiscussionCommentResult | null>;

  resolveDiscussion(
    organizationId: string,
    commentId: string,
    actor: ActorIdentity,
  ): Promise<DiscussionCommentResult | null>;

  reopenDiscussion(
    organizationId: string,
    commentId: string,
    actor: ActorIdentity,
  ): Promise<DiscussionCommentResult | null>;
}
