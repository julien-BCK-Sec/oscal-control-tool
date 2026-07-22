import "server-only";

import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { CommentMention } from "@/data/collaboration";
import type { AppDatabase } from "./client";
import { commentMentions } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toMention(row: typeof commentMentions.$inferSelect): CommentMention {
  return {
    id: row.id,
    commentId: row.commentId,
    mentionedUserId: row.mentionedUserId,
    createdAt: row.createdAt,
  };
}

export async function replaceCommentMentions(
  db: AppDatabase,
  commentId: string,
  mentionedUserIds: readonly string[],
): Promise<CommentMention[]> {
  await db
    .delete(commentMentions)
    .where(eq(commentMentions.commentId, commentId));

  const created: CommentMention[] = [];
  const createdAt = nowIso();
  for (const userId of mentionedUserIds) {
    const trimmed = userId.trim();
    if (!trimmed) {
      continue;
    }
    const row = {
      id: randomUUID(),
      commentId,
      mentionedUserId: trimmed,
      createdAt,
    };
    await db.insert(commentMentions).values(row);
    created.push(toMention(row));
  }
  return created;
}

export async function listMentionsForComment(
  db: AppDatabase,
  commentId: string,
): Promise<CommentMention[]> {
  const rows = await db
    .select()
    .from(commentMentions)
    .where(eq(commentMentions.commentId, commentId));
  return rows.map(toMention);
}

export async function listMentionsForComments(
  db: AppDatabase,
  commentIds: readonly string[],
): Promise<CommentMention[]> {
  if (commentIds.length === 0) {
    return [];
  }
  const results: CommentMention[] = [];
  for (const commentId of commentIds) {
    const rows = await db
      .select()
      .from(commentMentions)
      .where(eq(commentMentions.commentId, commentId));
    results.push(...rows.map(toMention));
  }
  return results;
}

/** Guard: only mention users that appear in the provided allow-list. */
export function filterMentionIdsToOrgMembers(
  mentionedUserIds: readonly string[],
  orgMemberUserIds: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of mentionedUserIds) {
    if (!orgMemberUserIds.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
}
