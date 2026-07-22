"use server";

import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import type { OrgContext } from "@/authz/authorize";
import {
  acceptInvitation,
  inviteMember,
  removeMember,
  revokeInvitation,
} from "@/server/authorized-organizations";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

async function resolveContext(organizationId: string): Promise<
  | { ok: true; ctx: OrgContext; userId: string }
  | { ok: false; message: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Authentication is required." };
  }
  const ctx = await resolveOrgContext(user.id, organizationId);
  if (!ctx) {
    return { ok: false, message: "No membership in this organization." };
  }
  return { ok: true, ctx, userId: user.id };
}

export type InviteMemberActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function inviteMemberAction(input: {
  organizationId: string;
  email: string;
  role: string;
}): Promise<InviteMemberActionResult> {
  let organizationId: string;
  try {
    organizationId = requireNonEmptyString(input.organizationId, "organizationId");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid input." };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const result = await inviteMember(orgRepo, resolved.ctx, {
    email: typeof input.email === "string" ? input.email : "",
    role: typeof input.role === "string" ? input.role : "",
    inviterId: resolved.userId,
  });
  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

/** Resend supersedes any pending invitation for the email (ADR-018). */
export const resendInvitationAction = inviteMemberAction;

export async function revokeInvitationAction(input: {
  organizationId: string;
  invitationId: string;
}): Promise<InviteMemberActionResult> {
  let organizationId: string;
  let invitationId: string;
  try {
    organizationId = requireNonEmptyString(input.organizationId, "organizationId");
    invitationId = requireNonEmptyString(input.invitationId, "invitationId");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid input." };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const revoked = await revokeInvitation(orgRepo, resolved.ctx, invitationId);
  return revoked
    ? { ok: true }
    : { ok: false, message: "Invitation not found." };
}

export async function removeMemberAction(input: {
  organizationId: string;
  userId: string;
}): Promise<InviteMemberActionResult> {
  let organizationId: string;
  let userId: string;
  try {
    organizationId = requireNonEmptyString(input.organizationId, "organizationId");
    userId = requireNonEmptyString(input.userId, "userId");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid input." };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const result = await removeMember(orgRepo, resolved.ctx, userId);
  return result.ok ? { ok: true } : { ok: false, message: result.message ?? "Failed." };
}

export type AcceptInvitationActionResult =
  | { ok: true; organizationId: string }
  | { ok: false; message: string };

export async function acceptInvitationAction(
  invitationId: string,
): Promise<AcceptInvitationActionResult> {
  let id: string;
  try {
    id = requireNonEmptyString(invitationId, "invitationId");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid input." };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to accept this invitation." };
  }
  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const result = await acceptInvitation(
    orgRepo,
    { id: user.id, email: user.email, emailVerified: user.emailVerified },
    id,
  );
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  return { ok: true, organizationId: result.organizationId };
}
