import type {
  InvitationDto,
  OrganizationMemberDto,
  OrganizationRepository,
} from "@/persistence/postgres/organization-repository";
import { isInvitationExpired } from "@/persistence/postgres/organization-repository";
import {
  AuthorizationError,
  requirePermission,
  type OrgContext,
} from "@/authz/authorize";
import { isOrgRole, type OrgRole } from "@/authz/permissions";

/**
 * Authorized organization/team management (Milestone 1 WP6, ADR-018).
 *
 * All member/invitation mutations are gated by the central RBAC matrix and
 * bound to the caller's organization. Privilege escalation is prevented: a user
 * cannot grant a role above its own authority. Invitation tokens (ids) are
 * never logged. Acceptance is idempotent, requires a verified email matching
 * the invitation, and can only create a membership in the invitation's own
 * organization.
 */

export type TeamOverview = {
  members: OrganizationMemberDto[];
  invitations: InvitationDto[];
};

/** Only organization administrators may assign organization_admin (fail closed). */
export function canAssignRole(inviterRole: OrgRole, targetRole: OrgRole): boolean {
  if (inviterRole === "organization_admin") {
    return true;
  }
  // No other role manages members today; never allow assigning admin.
  return targetRole !== "organization_admin";
}

export async function listTeam(
  orgRepo: OrganizationRepository,
  ctx: OrgContext,
): Promise<TeamOverview> {
  requirePermission(ctx, ctx.organizationId, "org.manage_members");
  const [members, invitations] = await Promise.all([
    orgRepo.listMembers(ctx.organizationId),
    orgRepo.listPendingInvitations(ctx.organizationId),
  ]);
  return { members, invitations };
}

export type InviteMemberResult =
  | { ok: true; invitation: InvitationDto }
  | { ok: false; reason: "validation" | "forbidden"; message: string };

export async function inviteMember(
  orgRepo: OrganizationRepository,
  ctx: OrgContext,
  input: { email: string; role: string; inviterId: string; now?: Date },
): Promise<InviteMemberResult> {
  requirePermission(ctx, ctx.organizationId, "org.invite");

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, reason: "validation", message: "A valid email is required." };
  }
  if (!isOrgRole(input.role)) {
    return { ok: false, reason: "validation", message: "Unknown role." };
  }
  if (!canAssignRole(ctx.role, input.role)) {
    return {
      ok: false,
      reason: "forbidden",
      message: "You cannot assign a role above your own authority.",
    };
  }

  // Resend supersedes any pending invitation for this email (ADR-018).
  await orgRepo.cancelPendingInvitationsForEmail(ctx.organizationId, email);

  const invitation = await orgRepo.createInvitation({
    organizationId: ctx.organizationId,
    email,
    role: input.role,
    inviterId: input.inviterId,
    now: input.now,
  });
  return { ok: true, invitation };
}

export async function revokeInvitation(
  orgRepo: OrganizationRepository,
  ctx: OrgContext,
  invitationId: string,
): Promise<boolean> {
  requirePermission(ctx, ctx.organizationId, "org.manage_members");
  const invitation = await orgRepo.getInvitationById(invitationId);
  if (!invitation || invitation.organizationId !== ctx.organizationId) {
    return false;
  }
  return orgRepo.setInvitationStatus(invitationId, "canceled");
}

export async function removeMember(
  orgRepo: OrganizationRepository,
  ctx: OrgContext,
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  requirePermission(ctx, ctx.organizationId, "org.manage_members");
  const membership = await orgRepo.getMembership(ctx.organizationId, userId);
  if (!membership) {
    return { ok: false, message: "Member not found." };
  }
  if (membership.role === "organization_admin") {
    const adminCount = await orgRepo.countAdmins(ctx.organizationId);
    if (adminCount <= 1) {
      return {
        ok: false,
        message: "Cannot remove the last organization administrator.",
      };
    }
  }
  const removed = await orgRepo.removeMembership(ctx.organizationId, userId);
  return { ok: removed };
}

export type AcceptInvitationResult =
  | { ok: true; organizationId: string; role: OrgRole; alreadyMember: boolean }
  | {
      ok: false;
      reason:
        | "not-found"
        | "expired"
        | "not-pending"
        | "email-mismatch"
        | "email-unverified";
      message: string;
    };

/**
 * Accept an invitation. Requires an authenticated user with a verified email
 * matching the invitation. Idempotent: a second accept for an already-active
 * membership succeeds without creating a duplicate. Creates the membership only
 * in the invitation's organization (never client-supplied).
 */
export async function acceptInvitation(
  orgRepo: OrganizationRepository,
  user: { id: string; email: string; emailVerified: boolean },
  invitationId: string,
  now: Date = new Date(),
): Promise<AcceptInvitationResult> {
  const invitation = await orgRepo.getInvitationById(invitationId);
  if (!invitation) {
    return { ok: false, reason: "not-found", message: "Invitation not found." };
  }
  if (invitation.status === "accepted") {
    // Idempotent: confirm the membership exists for this user, then succeed.
    const existing = await orgRepo.getMembership(
      invitation.organizationId,
      user.id,
    );
    if (existing) {
      return {
        ok: true,
        organizationId: invitation.organizationId,
        role: existing.role,
        alreadyMember: true,
      };
    }
    return { ok: false, reason: "not-pending", message: "Invitation already used." };
  }
  if (invitation.status !== "pending") {
    return {
      ok: false,
      reason: "not-pending",
      message: "Invitation is no longer valid.",
    };
  }
  if (isInvitationExpired(invitation.expiresAt, now)) {
    return { ok: false, reason: "expired", message: "Invitation has expired." };
  }
  if (!user.emailVerified) {
    return {
      ok: false,
      reason: "email-unverified",
      message: "Verify your email address before accepting.",
    };
  }
  if (user.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
    return {
      ok: false,
      reason: "email-mismatch",
      message: "This invitation was issued to a different email address.",
    };
  }

  const existing = await orgRepo.getMembership(
    invitation.organizationId,
    user.id,
  );
  const alreadyMember = existing !== null;
  if (!alreadyMember) {
    await orgRepo.upsertMembership({
      organizationId: invitation.organizationId,
      userId: user.id,
      role: invitation.role,
    });
  }
  await orgRepo.setInvitationStatus(invitationId, "accepted");
  return {
    ok: true,
    organizationId: invitation.organizationId,
    role: alreadyMember ? (existing?.role ?? invitation.role) : invitation.role,
    alreadyMember,
  };
}

export { AuthorizationError };
