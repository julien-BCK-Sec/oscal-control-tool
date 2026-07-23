"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Comment } from "@/data/collaboration";
import {
  createDiscussionAction,
  deleteDiscussionAction,
  editDiscussionAction,
  listDiscussionsAction,
  reopenDiscussionAction,
  resolveDiscussionAction,
} from "@/app/actions/discussions";
import { listMentionCandidatesAction } from "@/app/actions/mention-candidates";
import type { MentionCandidate } from "@/app/actions/mention-candidates";
import { MentionTextarea } from "@/components/collaboration/MentionTextarea";
import { Button } from "@/components/design-system/button/Button";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";
import { Stack } from "@/components/design-system/layout/primitives";
import { formatControlActivityTimestamp } from "@/data/control-activity";
import { notifyNotificationsChanged } from "@/components/collaboration/notifications-changed";

export type DiscussionPanelProps = {
  projectId: string;
  controlId: string;
  refreshToken?: number;
  focusCommentId?: string | null;
  onFocusCommentHandled?: () => void;
  onActivity?: () => void;
};

function buildTree(comments: Comment[]): Map<string | null, Comment[]> {
  const map = new Map<string | null, Comment[]>();
  for (const comment of comments) {
    const key = comment.parentCommentId;
    const list = map.get(key) ?? [];
    list.push(comment);
    map.set(key, list);
  }
  return map;
}

function CommentNode({
  comment,
  depth,
  childrenByParent,
  pending,
  highlightId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReopen,
}: {
  comment: Comment;
  depth: number;
  childrenByParent: Map<string | null, Comment[]>;
  pending: boolean;
  highlightId: string | null;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onResolve: (commentId: string) => void;
  onReopen: (commentId: string) => void;
}) {
  const children = childrenByParent.get(comment.id) ?? [];
  const deleted = Boolean(comment.deletedAt);
  const highlighted = comment.id === highlightId;
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!highlighted || !articleRef.current) {
      return;
    }
    articleRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlighted]);

  return (
    <li
      className="min-w-0"
      style={{ marginLeft: depth > 0 ? Math.min(depth, 4) * 12 : 0 }}
    >
      <article
        ref={articleRef}
        id={`discussion-comment-${comment.id}`}
        className={`rounded-md border px-3 py-2 ${
          highlighted
            ? "border-accent bg-accent-muted/50 ring-2 ring-accent/40"
            : comment.resolved
              ? "border-border bg-success/5"
              : "border-border bg-surface"
        }`}
        aria-label={deleted ? "Deleted comment" : "Comment"}
        aria-current={highlighted ? "true" : undefined}
      >
        {deleted ? (
          <p className="text-sm italic text-text-muted">Comment deleted</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-text-primary">
            {comment.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-text-muted">
          <time dateTime={comment.createdAt}>
            {formatControlActivityTimestamp(comment.createdAt)}
          </time>
          {comment.resolved ? " · Resolved" : ""}
        </p>
        {!deleted ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => onReply(comment.id)}
            >
              Reply
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => onEdit(comment)}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => onDelete(comment.id)}
            >
              Delete
            </Button>
            {comment.resolved ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => onReopen(comment.id)}
              >
                Reopen
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => onResolve(comment.id)}
              >
                Resolve
              </Button>
            )}
          </div>
        ) : null}
      </article>
      {children.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              childrenByParent={childrenByParent}
              pending={pending}
              highlightId={highlightId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              onReopen={onReopen}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function DiscussionPanel({
  projectId,
  controlId,
  refreshToken = 0,
  focusCommentId = null,
  onFocusCommentHandled,
  onActivity,
}: DiscussionPanelProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [body, setBody] = useState("");
  const [parentCommentId, setParentCommentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusFallback, setFocusFallback] = useState<string | null>(null);
  const [appliedCommentFocus, setAppliedCommentFocus] = useState<string | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      try {
        const [rows, mentionCandidates] = await Promise.all([
          listDiscussionsAction(projectId, controlId),
          listMentionCandidatesAction(projectId),
        ]);
        setComments(rows);
        setCandidates(mentionCandidates);
        setError(null);
      } catch {
        setError("Unable to load discussions.");
        setComments([]);
      }
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount via key
  }, [projectId, controlId, refreshToken]);

  // Apply deep-link comment focus during render once comments are loaded
  // (same pattern as ControlBrowser focusRequest handling).
  if (
    focusCommentId &&
    comments !== null &&
    appliedCommentFocus !== focusCommentId
  ) {
    setAppliedCommentFocus(focusCommentId);
    const match = comments.find((comment) => comment.id === focusCommentId);
    if (match && !match.deletedAt) {
      setFocusFallback(null);
    } else {
      setFocusFallback("This comment is no longer available.");
    }
  }

  useEffect(() => {
    if (focusCommentId && appliedCommentFocus === focusCommentId) {
      onFocusCommentHandled?.();
    }
  }, [focusCommentId, appliedCommentFocus, onFocusCommentHandled]);

  const activeHighlightId = appliedCommentFocus;

  const visibleComments = useMemo(
    () =>
      (comments ?? []).filter(
        (comment) =>
          !comment.deletedAt || comment.id === activeHighlightId,
      ),
    [comments, activeHighlightId],
  );
  const tree = useMemo(() => buildTree(visibleComments), [visibleComments]);
  const roots = tree.get(null) ?? [];

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Comment body is required.");
      return;
    }
    startTransition(async () => {
      const result = editingId
        ? await editDiscussionAction({
            projectId,
            commentId: editingId,
            body: trimmed,
          })
        : await createDiscussionAction({
            projectId,
            controlId,
            parentCommentId,
            body: trimmed,
          });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setBody("");
      setParentCommentId(null);
      setEditingId(null);
      setError(null);
      onActivity?.();
      notifyNotificationsChanged();
      reload();
    });
  }

  return (
    <SidebarCard title="Discussions" titleId="control-discussions-heading">
      <Stack gap="sm">
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {focusFallback ? (
          <p className="text-sm text-text-secondary" role="status">
            {focusFallback}
          </p>
        ) : null}

        {comments === null ? (
          <p className="text-sm text-text-muted" role="status">
            Loading…
          </p>
        ) : roots.length === 0 ? (
          <p className="text-sm text-text-muted">No discussions yet.</p>
        ) : (
          <ul className="space-y-2">
            {roots.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                depth={0}
                childrenByParent={tree}
                pending={pending}
                highlightId={activeHighlightId}
                onReply={(parentId) => {
                  setParentCommentId(parentId);
                  setEditingId(null);
                }}
                onEdit={(c) => {
                  setEditingId(c.id);
                  setParentCommentId(null);
                  setBody(c.body);
                }}
                onDelete={(commentId) => {
                  startTransition(async () => {
                    const result = await deleteDiscussionAction({
                      projectId,
                      commentId,
                    });
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    onActivity?.();
                    notifyNotificationsChanged();
                    reload();
                  });
                }}
                onResolve={(commentId) => {
                  startTransition(async () => {
                    const result = await resolveDiscussionAction({
                      projectId,
                      commentId,
                    });
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    onActivity?.();
                    notifyNotificationsChanged();
                    reload();
                  });
                }}
                onReopen={(commentId) => {
                  startTransition(async () => {
                    const result = await reopenDiscussionAction({
                      projectId,
                      commentId,
                    });
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    onActivity?.();
                    notifyNotificationsChanged();
                    reload();
                  });
                }}
              />
            ))}
          </ul>
        )}

        <div>
          <label className="label" htmlFor={`discussion-body-${controlId}`}>
            {editingId
              ? "Edit comment"
              : parentCommentId
                ? "Reply"
                : "New discussion"}
          </label>
          <MentionTextarea
            id={`discussion-body-${controlId}`}
            value={body}
            onChange={setBody}
            candidates={candidates}
            rows={3}
            className="field mt-1"
            placeholder="Write a comment. Use @ to mention a teammate."
            disabled={pending}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending}
              onClick={submit}
            >
              {editingId ? "Save" : parentCommentId ? "Post reply" : "Post"}
            </Button>
            {editingId || parentCommentId ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setEditingId(null);
                  setParentCommentId(null);
                  setBody("");
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </Stack>
    </SidebarCard>
  );
}
