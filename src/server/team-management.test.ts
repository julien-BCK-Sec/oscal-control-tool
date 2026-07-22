import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import {
  INVITATION_TTL_MS,
  createPostgresOrganizationRepository,
} from "@/persistence/postgres/organization-repository";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import {
  acceptInvitation,
  canAssignRole,
  inviteMember,
  listTeam,
  removeMember,
  revokeInvitation,
} from "./authorized-organizations";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b" });

  async function makeUser(email: string, emailVerified = true) {
    const id = randomUUID();
    const now = new Date();
    await db.insert(userTable).values({
      id,
      name: email,
      email,
      emailVerified,
      createdAt: now,
      updatedAt: now,
    });
    return { id, email, emailVerified };
  }

  // The invitation.inviter_id column has a foreign key to user (Better Auth
  // schema), so invitations must be issued by a real user.
  const inviter = await makeUser("inviter@example.com", true);

  return { db, orgs, orgA, orgB, makeUser, inviter };
}

function ctx(organizationId: string, role: OrgRole, userId = "admin"): OrgContext {
  return { userId, organizationId, role };
}

describe("privilege escalation guard (canAssignRole)", () => {
  it("lets admins assign any role", () => {
    assert.equal(canAssignRole("organization_admin", "organization_admin"), true);
    assert.equal(canAssignRole("organization_admin", "viewer"), true);
  });

  it("never lets a non-admin grant organization_admin", () => {
    assert.equal(canAssignRole("project_manager", "organization_admin"), false);
    assert.equal(canAssignRole("author", "organization_admin"), false);
  });
});

describe("invitations (WP6)", () => {
  it("requires org.invite permission (viewer denied)", async () => {
    const { orgs, orgA, inviter } = await setup();
    await assert.rejects(
      () =>
        inviteMember(orgs, ctx(orgA.id, "viewer"), {
          email: "new@example.com",
          role: "author",
          inviterId: inviter.id,
        }),
      (e: unknown) => e instanceof AuthorizationError && e.code === "forbidden",
    );
  });

  it("rejects invalid email and unknown role", async () => {
    const { orgs, orgA, inviter } = await setup();
    const admin = ctx(orgA.id, "organization_admin");
    const bad = await inviteMember(orgs, admin, {
      email: "not-an-email",
      role: "author",
      inviterId: inviter.id,
    });
    assert.equal(bad.ok, false);
    const badRole = await inviteMember(orgs, admin, {
      email: "ok@example.com",
      role: "root",
      inviterId: inviter.id,
    });
    assert.equal(badRole.ok, false);
  });

  it("resend supersedes the prior pending invitation", async () => {
    const { orgs, orgA, inviter } = await setup();
    const admin = ctx(orgA.id, "organization_admin");
    const first = await inviteMember(orgs, admin, {
      email: "invitee@example.com",
      role: "author",
      inviterId: inviter.id,
    });
    const second = await inviteMember(orgs, admin, {
      email: "invitee@example.com",
      role: "reviewer",
      inviterId: inviter.id,
    });
    assert.equal(first.ok && second.ok, true);

    const pending = await orgs.listPendingInvitations(orgA.id);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].role, "reviewer");
  });

  it("normalizes the email to lower case", async () => {
    const { orgs, orgA, inviter } = await setup();
    const result = await inviteMember(orgs, ctx(orgA.id, "organization_admin"), {
      email: "MixedCase@Example.com",
      role: "author",
      inviterId: inviter.id,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.invitation.email, "mixedcase@example.com");
    }
  });

  it("revokes only invitations in the caller's organization", async () => {
    const { orgs, orgA, orgB, inviter } = await setup();
    const invite = await inviteMember(orgs, ctx(orgA.id, "organization_admin"), {
      email: "invitee@example.com",
      role: "author",
      inviterId: inviter.id,
    });
    assert.ok(invite.ok);
    if (!invite.ok) return;

    // Admin of B cannot revoke A's invitation.
    const wrongOrg = await revokeInvitation(
      orgs,
      ctx(orgB.id, "organization_admin"),
      invite.invitation.id,
    );
    assert.equal(wrongOrg, false);

    const ok = await revokeInvitation(
      orgs,
      ctx(orgA.id, "organization_admin"),
      invite.invitation.id,
    );
    assert.equal(ok, true);
    const pending = await orgs.listPendingInvitations(orgA.id);
    assert.equal(pending.length, 0);
  });
});

describe("accept invitation", () => {
  it("creates a membership for a verified matching user", async () => {
    const { orgs, orgA, makeUser, inviter } = await setup();
    const invite = await inviteMember(orgs, ctx(orgA.id, "organization_admin"), {
      email: "invitee@example.com",
      role: "reviewer",
      inviterId: inviter.id,
    });
    assert.ok(invite.ok);
    if (!invite.ok) return;
    const invited = await makeUser("invitee@example.com", true);

    const result = await acceptInvitation(orgs, invited, invite.invitation.id);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.organizationId, orgA.id);
      assert.equal(result.role, "reviewer");
    }
    const membership = await orgs.getMembership(orgA.id, invited.id);
    assert.equal(membership?.role, "reviewer");
  });

  it("is idempotent when accepted twice", async () => {
    const { orgs, orgA, makeUser, inviter } = await setup();
    const invite = await inviteMember(orgs, ctx(orgA.id, "organization_admin"), {
      email: "invitee@example.com",
      role: "author",
      inviterId: inviter.id,
    });
    assert.ok(invite.ok);
    if (!invite.ok) return;
    const invited = await makeUser("invitee@example.com", true);

    const first = await acceptInvitation(orgs, invited, invite.invitation.id);
    const second = await acceptInvitation(orgs, invited, invite.invitation.id);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (second.ok) {
      assert.equal(second.alreadyMember, true);
    }
    const members = await orgs.listMembers(orgA.id);
    assert.equal(members.filter((m) => m.userId === invited.id).length, 1);
  });

  it("rejects an email mismatch", async () => {
    const { orgs, orgA, makeUser, inviter } = await setup();
    const invite = await inviteMember(orgs, ctx(orgA.id, "organization_admin"), {
      email: "invitee@example.com",
      role: "author",
      inviterId: inviter.id,
    });
    assert.ok(invite.ok);
    if (!invite.ok) return;
    const other = await makeUser("someone-else@example.com", true);

    const result = await acceptInvitation(orgs, other, invite.invitation.id);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "email-mismatch");
    }
    assert.equal(await orgs.getMembership(orgA.id, other.id), null);
  });

  it("rejects an unverified email", async () => {
    const { orgs, orgA, makeUser, inviter } = await setup();
    const invite = await inviteMember(orgs, ctx(orgA.id, "organization_admin"), {
      email: "invitee@example.com",
      role: "author",
      inviterId: inviter.id,
    });
    assert.ok(invite.ok);
    if (!invite.ok) return;
    const invited = await makeUser("invitee@example.com", false);

    const result = await acceptInvitation(orgs, invited, invite.invitation.id);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "email-unverified");
    }
  });

  it("rejects an expired invitation", async () => {
    const { orgs, orgA, makeUser, inviter } = await setup();
    const past = new Date(Date.now() - INVITATION_TTL_MS - 1000);
    const invitation = await orgs.createInvitation({
      organizationId: orgA.id,
      email: "invitee@example.com",
      role: "author",
      inviterId: inviter.id,
      now: past,
    });
    const invited = await makeUser("invitee@example.com", true);

    const result = await acceptInvitation(orgs, invited, invitation.id);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "expired");
    }
  });

  it("returns not-found for an unknown invitation", async () => {
    const { orgs, makeUser } = await setup();
    const invited = await makeUser("invitee@example.com", true);
    const result = await acceptInvitation(orgs, invited, "does-not-exist");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not-found");
    }
  });
});

describe("membership management", () => {
  it("enforces membership uniqueness on repeated upsert", async () => {
    const { orgs, orgA, makeUser } = await setup();
    const u = await makeUser("member@example.com", true);
    await orgs.upsertMembership({ organizationId: orgA.id, userId: u.id, role: "author" });
    await orgs.upsertMembership({ organizationId: orgA.id, userId: u.id, role: "reviewer" });
    const members = await orgs.listMembers(orgA.id);
    const mine = members.filter((m) => m.userId === u.id);
    assert.equal(mine.length, 1);
    assert.equal(mine[0].role, "reviewer");
  });

  it("protects the last organization administrator", async () => {
    const { orgs, orgA, makeUser } = await setup();
    const admin = await makeUser("admin@example.com", true);
    await orgs.upsertMembership({
      organizationId: orgA.id,
      userId: admin.id,
      role: "organization_admin",
    });

    const removed = await removeMember(
      orgs,
      ctx(orgA.id, "organization_admin"),
      admin.id,
    );
    assert.equal(removed.ok, false);
    assert.match(removed.message ?? "", /last organization administrator/i);
  });

  it("requires org.manage_members to view the team", async () => {
    const { orgs, orgA } = await setup();
    await assert.rejects(
      () => listTeam(orgs, ctx(orgA.id, "author")),
      (e: unknown) => e instanceof AuthorizationError && e.code === "forbidden",
    );
  });
});
