import type { OrganizationMemberDto } from "@/persistence/postgres/organization-repository";
import { extractMentionTokens } from "./mentions";

export type ResolvedMention = {
  token: string;
  userId: string;
  displayName: string;
  email: string;
};

/**
 * Resolve `@token` mentions to organization members only.
 * Matching order per token: exact email, email local-part, display name
 * (all case-insensitive). Unresolved tokens are ignored.
 */
export function resolveMentions(
  body: string,
  members: readonly OrganizationMemberDto[],
): ResolvedMention[] {
  const tokens = extractMentionTokens(body);
  if (tokens.length === 0 || members.length === 0) {
    return [];
  }

  const byEmail = new Map<string, OrganizationMemberDto>();
  const byLocal = new Map<string, OrganizationMemberDto>();
  const byName = new Map<string, OrganizationMemberDto>();
  for (const member of members) {
    const email = member.email.trim().toLowerCase();
    byEmail.set(email, member);
    const at = email.indexOf("@");
    if (at > 0) {
      const local = email.slice(0, at);
      if (!byLocal.has(local)) {
        byLocal.set(local, member);
      }
    }
    const name = member.name.trim().toLowerCase();
    if (name && !byName.has(name)) {
      byName.set(name, member);
    }
  }

  const resolved: ResolvedMention[] = [];
  const seenUsers = new Set<string>();
  for (const { token } of tokens) {
    const key = token.toLowerCase();
    const member =
      byEmail.get(key) ?? byLocal.get(key) ?? byName.get(key) ?? null;
    if (!member || seenUsers.has(member.userId)) {
      continue;
    }
    seenUsers.add(member.userId);
    resolved.push({
      token,
      userId: member.userId,
      displayName: member.name,
      email: member.email,
    });
  }
  return resolved;
}
