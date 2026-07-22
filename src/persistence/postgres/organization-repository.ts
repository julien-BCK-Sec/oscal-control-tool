import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "./client";
import {
  invitation as invitationTable,
  member as memberTable,
  organization as organizationTable,
  user as userTable,
} from "./auth-schema";
import { isOrgRole, type OrgRole } from "@/authz/permissions";

/**
 * Application-facing repository over the Better Auth identity/organization
 * tables (ADR-015/017/018). Keeps Drizzle types out of services, actions, and
 * UI. Control Freak owns authorization; callers must gate access before using
 * these methods (see `src/authz`).
 *
 * Invitation identifiers are the opaque token: cryptographically unpredictable
 * (`randomUUID`, v4). Tokens are never logged. Acceptance is idempotent and a
 * resend supersedes the prior pending invitation (ADR-018).
 */

/** Invitation lifetime: seven days (ADR-018). */
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type OrganizationDto = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type MembershipDto = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
};

export type OrganizationMemberDto = MembershipDto & {
  email: string;
  name: string;
};

export type UserOrganizationDto = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrgRole;
};

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled";

export type InvitationDto = {
  id: string;
  organizationId: string;
  email: string;
  role: OrgRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  inviterId: string;
};

function normalizeRole(value: string): OrgRole {
  return isOrgRole(value) ? value : "viewer";
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function isExpired(expiresAt: Date | string, now: Date): boolean {
  const time = expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt);
  return Number.isFinite(time) ? time <= now.getTime() : true;
}

export interface OrganizationRepository {
  getOrganizationById(organizationId: string): Promise<OrganizationDto | null>;
  getOrganizationBySlug(slug: string): Promise<OrganizationDto | null>;
  createOrganization(input: {
    name: string;
    slug: string;
    id?: string;
  }): Promise<OrganizationDto>;

  getMembership(
    organizationId: string,
    userId: string,
  ): Promise<MembershipDto | null>;
  listOrganizationsForUser(userId: string): Promise<UserOrganizationDto[]>;
  listMembers(organizationId: string): Promise<OrganizationMemberDto[]>;
  upsertMembership(input: {
    organizationId: string;
    userId: string;
    role: OrgRole;
  }): Promise<MembershipDto>;
  removeMembership(organizationId: string, userId: string): Promise<boolean>;
  countAdmins(organizationId: string): Promise<number>;

  getUserByEmail(
    email: string,
  ): Promise<{ id: string; email: string; name: string; emailVerified: boolean } | null>;

  createInvitation(input: {
    organizationId: string;
    email: string;
    role: OrgRole;
    inviterId: string;
    now?: Date;
  }): Promise<InvitationDto>;
  getInvitationById(invitationId: string): Promise<InvitationDto | null>;
  listPendingInvitations(organizationId: string): Promise<InvitationDto[]>;
  setInvitationStatus(
    invitationId: string,
    status: InvitationStatus,
  ): Promise<boolean>;
  cancelPendingInvitationsForEmail(
    organizationId: string,
    email: string,
  ): Promise<number>;
}

export function createPostgresOrganizationRepository(
  db: AppDatabase,
): OrganizationRepository {
  function toOrganization(
    row: typeof organizationTable.$inferSelect,
  ): OrganizationDto {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: toIso(row.createdAt),
    };
  }

  function toMembership(
    row: typeof memberTable.$inferSelect,
  ): MembershipDto {
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      role: normalizeRole(row.role),
      createdAt: toIso(row.createdAt),
    };
  }

  function toInvitation(
    row: typeof invitationTable.$inferSelect,
  ): InvitationDto {
    return {
      id: row.id,
      organizationId: row.organizationId,
      email: row.email,
      role: normalizeRole(row.role ?? "viewer"),
      status: (row.status as InvitationStatus) ?? "pending",
      expiresAt: toIso(row.expiresAt),
      createdAt: toIso(row.createdAt),
      inviterId: row.inviterId,
    };
  }

  return {
    async getOrganizationById(organizationId) {
      const rows = await db
        .select()
        .from(organizationTable)
        .where(eq(organizationTable.id, organizationId))
        .limit(1);
      return rows[0] ? toOrganization(rows[0]) : null;
    },

    async getOrganizationBySlug(slug) {
      const rows = await db
        .select()
        .from(organizationTable)
        .where(eq(organizationTable.slug, slug))
        .limit(1);
      return rows[0] ? toOrganization(rows[0]) : null;
    },

    async createOrganization(input) {
      const id = input.id ?? randomUUID();
      const now = new Date();
      await db.insert(organizationTable).values({
        id,
        name: input.name,
        slug: input.slug,
        createdAt: now,
      });
      return { id, name: input.name, slug: input.slug, createdAt: now.toISOString() };
    },

    async getMembership(organizationId, userId) {
      const rows = await db
        .select()
        .from(memberTable)
        .where(
          and(
            eq(memberTable.organizationId, organizationId),
            eq(memberTable.userId, userId),
          ),
        )
        .limit(1);
      return rows[0] ? toMembership(rows[0]) : null;
    },

    async listOrganizationsForUser(userId) {
      const rows = await db
        .select({
          organizationId: memberTable.organizationId,
          role: memberTable.role,
          organizationName: organizationTable.name,
          organizationSlug: organizationTable.slug,
        })
        .from(memberTable)
        .innerJoin(
          organizationTable,
          eq(memberTable.organizationId, organizationTable.id),
        )
        .where(eq(memberTable.userId, userId))
        .orderBy(organizationTable.name);
      return rows.map((row) => ({
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        organizationSlug: row.organizationSlug,
        role: normalizeRole(row.role),
      }));
    },

    async listMembers(organizationId) {
      const rows = await db
        .select({
          id: memberTable.id,
          organizationId: memberTable.organizationId,
          userId: memberTable.userId,
          role: memberTable.role,
          createdAt: memberTable.createdAt,
          email: userTable.email,
          name: userTable.name,
        })
        .from(memberTable)
        .innerJoin(userTable, eq(memberTable.userId, userTable.id))
        .where(eq(memberTable.organizationId, organizationId))
        .orderBy(memberTable.createdAt);
      return rows.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        userId: row.userId,
        role: normalizeRole(row.role),
        createdAt: toIso(row.createdAt),
        email: row.email,
        name: row.name,
      }));
    },

    async upsertMembership(input) {
      const existing = await db
        .select()
        .from(memberTable)
        .where(
          and(
            eq(memberTable.organizationId, input.organizationId),
            eq(memberTable.userId, input.userId),
          ),
        )
        .limit(1);
      if (existing[0]) {
        await db
          .update(memberTable)
          .set({ role: input.role })
          .where(eq(memberTable.id, existing[0].id));
        return toMembership({ ...existing[0], role: input.role });
      }
      const id = randomUUID();
      const now = new Date();
      await db.insert(memberTable).values({
        id,
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
        createdAt: now,
      });
      return {
        id,
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
        createdAt: now.toISOString(),
      };
    },

    async removeMembership(organizationId, userId) {
      const deleted = await db
        .delete(memberTable)
        .where(
          and(
            eq(memberTable.organizationId, organizationId),
            eq(memberTable.userId, userId),
          ),
        )
        .returning({ id: memberTable.id });
      return deleted.length > 0;
    },

    async countAdmins(organizationId) {
      const rows = await db
        .select({ id: memberTable.id })
        .from(memberTable)
        .where(
          and(
            eq(memberTable.organizationId, organizationId),
            eq(memberTable.role, "organization_admin"),
          ),
        );
      return rows.length;
    },

    async getUserByEmail(email) {
      const rows = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        emailVerified: row.emailVerified,
      };
    },

    async createInvitation(input) {
      const now = input.now ?? new Date();
      const id = randomUUID();
      const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);
      await db.insert(invitationTable).values({
        id,
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        status: "pending",
        expiresAt,
        createdAt: now,
        inviterId: input.inviterId,
      });
      return {
        id,
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        inviterId: input.inviterId,
      };
    },

    async getInvitationById(invitationId) {
      const rows = await db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.id, invitationId))
        .limit(1);
      return rows[0] ? toInvitation(rows[0]) : null;
    },

    async listPendingInvitations(organizationId) {
      const now = new Date();
      const rows = await db
        .select()
        .from(invitationTable)
        .where(
          and(
            eq(invitationTable.organizationId, organizationId),
            eq(invitationTable.status, "pending"),
          ),
        )
        .orderBy(desc(invitationTable.createdAt));
      return rows
        .map(toInvitation)
        .filter((invite) => !isExpired(invite.expiresAt, now));
    },

    async setInvitationStatus(invitationId, status) {
      const updated = await db
        .update(invitationTable)
        .set({ status })
        .where(eq(invitationTable.id, invitationId))
        .returning({ id: invitationTable.id });
      return updated.length > 0;
    },

    async cancelPendingInvitationsForEmail(organizationId, email) {
      const updated = await db
        .update(invitationTable)
        .set({ status: "canceled" })
        .where(
          and(
            eq(invitationTable.organizationId, organizationId),
            eq(invitationTable.email, email),
            eq(invitationTable.status, "pending"),
          ),
        )
        .returning({ id: invitationTable.id });
      return updated.length;
    },
  };
}

export { isExpired as isInvitationExpired };
