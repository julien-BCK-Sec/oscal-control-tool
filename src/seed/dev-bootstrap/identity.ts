import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import type { AppDatabase } from "@/persistence/postgres/client";
import { account, user } from "@/persistence/postgres/auth-schema";
import {
  createPostgresOrganizationRepository,
  type OrganizationDto,
  type OrganizationRepository,
} from "@/persistence/postgres/organization-repository";
import {
  DEMO_PASSWORD,
  DEMO_USERS,
  ORGS,
  type DemoUserSpec,
} from "./constants";

export type EnsuredUser = {
  id: string;
  email: string;
  name: string;
  created: boolean;
};

export type EnsuredOrg = OrganizationDto & { created: boolean };

export type BootstrapIdentityResult = {
  orgs: {
    acme: EnsuredOrg;
    contoso: EnsuredOrg;
  };
  users: Record<string, EnsuredUser>;
};

async function ensureUser(
  db: AppDatabase,
  spec: DemoUserSpec,
  password: string,
): Promise<EnsuredUser> {
  const email = spec.email.toLowerCase();
  const existing = (
    await db.select().from(user).where(eq(user.email, email)).limit(1)
  )[0];
  if (existing) {
    // Keep verified for demo login without email delivery.
    if (!existing.emailVerified) {
      await db
        .update(user)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(user.id, existing.id));
    }
    return {
      id: existing.id,
      email,
      name: existing.name,
      created: false,
    };
  }

  const now = new Date();
  const userId = randomUUID();
  await db.insert(user).values({
    id: userId,
    name: spec.name,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  });
  return { id: userId, email, name: spec.name, created: true };
}

async function ensureOrganization(
  orgRepo: OrganizationRepository,
  name: string,
  slug: string,
): Promise<EnsuredOrg> {
  const existing = await orgRepo.getOrganizationBySlug(slug);
  if (existing) {
    return { ...existing, created: false };
  }
  const created = await orgRepo.createOrganization({ name, slug });
  return { ...created, created: true };
}

/**
 * Create demo organizations, users (Better Auth credential accounts), and
 * memberships. Idempotent by org slug and user email.
 */
export async function ensureDemoIdentity(
  db: AppDatabase,
): Promise<BootstrapIdentityResult> {
  const orgRepo = createPostgresOrganizationRepository(db);

  const acme = await ensureOrganization(
    orgRepo,
    ORGS.acme.name,
    ORGS.acme.slug,
  );
  const contoso = await ensureOrganization(
    orgRepo,
    ORGS.contoso.name,
    ORGS.contoso.slug,
  );

  const users: Record<string, EnsuredUser> = {};
  for (const spec of DEMO_USERS) {
    const ensured = await ensureUser(db, spec, DEMO_PASSWORD);
    users[spec.email.toLowerCase()] = ensured;
    const organizationId = spec.org === "acme" ? acme.id : contoso.id;
    await orgRepo.upsertMembership({
      organizationId,
      userId: ensured.id,
      role: spec.role,
    });
  }

  // Tenant isolation: never add Acme users to Contoso or vice versa.
  // upsertMembership only for each user's home org (already done).

  return {
    orgs: { acme, contoso },
    users,
  };
}
