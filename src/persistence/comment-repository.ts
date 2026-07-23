import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from "@/data/collaboration";

export type ListCommentsOptions = {
  /** When true, include soft-deleted comments (moderator / audit views). */
  includeDeleted?: boolean;
};

/**
 * Persistence boundary for control discussion comments.
 * Always scoped by organizationId for tenant isolation.
 */
export interface CommentRepository {
  create(input: CreateCommentInput): Promise<Comment>;
  getById(
    organizationId: string,
    commentId: string,
  ): Promise<Comment | null>;
  listByControl(
    organizationId: string,
    projectId: string,
    controlId: string,
    options?: ListCommentsOptions,
  ): Promise<Comment[]>;
  update(
    organizationId: string,
    commentId: string,
    input: UpdateCommentInput,
  ): Promise<Comment | null>;
  softDelete(
    organizationId: string,
    commentId: string,
    deletedAt?: string,
  ): Promise<Comment | null>;
  restore(
    organizationId: string,
    commentId: string,
  ): Promise<Comment | null>;
  setResolved(
    organizationId: string,
    commentId: string,
    resolved: boolean,
  ): Promise<Comment | null>;
}
