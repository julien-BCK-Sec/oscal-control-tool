import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import type { AppDatabase } from "@/persistence/postgres/client";
import { account, user } from "@/persistence/postgres/auth-schema";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import type { BootstrapAdminConfig } from "./validate";

export type BootstrapAdminResult = {
  createdUser: boolean;
  createdOrg: boolean;
  userId: string;
  organizationId: string;
  organizationSlug: string;
  email: string;
};

/**
 * Idempotent initial administrator + organization for a normal deployment.
 *
 * Existing users, organizations, and memberships are reused. Passwords of
 * existing users are never overwritten.
 */
export async function ensureBootstrapAdmin(
  db: AppDatabase,
  config: BootstrapAdminConfig,
): Promise<BootstrapAdminResult> {
  const orgRepo = createPostgresOrganizationRepository(db);

  let userRow = (
    await db.select().from(user).where(eq(user.email, config.email)).limit(1)
  )[0];
  let createdUser = false;
  if (!userRow) {
    const now = new Date();
    const userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name: config.name,
      email: config.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(config.password),
      createdAt: now,
      updatedAt: now,
    });
    userRow = (
      await db.select().from(user).where(eq(user.email, config.email)).limit(1)
    )[0];
    createdUser = true;
  }

  if (!userRow) {
    throw new Error("Failed to create or load bootstrap administrator.");
  }

  let organization = await orgRepo.getOrganizationBySlug(config.orgSlug);
  let createdOrg = false;
  if (!organization) {
    organization = await orgRepo.createOrganization({
      name: config.orgName,
      slug: config.orgSlug,
    });
    createdOrg = true;
  }

  await orgRepo.upsertMembership({
    organizationId: organization.id,
    userId: userRow.id,
    role: "organization_admin",
  });

  return {
    createdUser,
    createdOrg,
    userId: userRow.id,
    organizationId: organization.id,
    organizationSlug: organization.slug,
    email: config.email,
  };
}
