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
  DEMO_USERS,
  ORGS,
  type DemoUserSpec,
} from "./constants";
import { resolveDemoBootstrapPassword } from "./password";

export type EnsuredUser = {
  id: string;
  email: string;
  name: string;
  created: boolean;
};

export type EnsuredOrg = OrganizationDto & { created: boolean };

export type BootstrapIdentityResult = {
  orgs: {
    cgds: EnsuredOrg;
    contoso: EnsuredOrg;
    firstdoor: EnsuredOrg;
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

async function ensureMembership(
  orgRepo: OrganizationRepository,
  organizationId: string,
  userId: string,
  role: DemoUserSpec["role"],
): Promise<void> {
  const members = await orgRepo.listMembers(organizationId);
  const existing = members.find((member) => member.userId === userId);
  if (existing) {
    return;
  }
  await orgRepo.upsertMembership({
    organizationId,
    userId,
    role,
  });
}

/**
 * Create canonical demo organizations, users, and memberships.
 * Idempotent by org slug and user email. Does not overwrite existing roles.
 */
export async function ensureDemoIdentity(
  db: AppDatabase,
  env: Record<string, string | undefined> = process.env,
): Promise<BootstrapIdentityResult> {
  const orgRepo = createPostgresOrganizationRepository(db);
  const password = resolveDemoBootstrapPassword(env);

  const cgds = await ensureOrganization(
    orgRepo,
    ORGS.cgds.name,
    ORGS.cgds.slug,
  );
  const contoso = await ensureOrganization(
    orgRepo,
    ORGS.contoso.name,
    ORGS.contoso.slug,
  );
  const firstdoor = await ensureOrganization(
    orgRepo,
    ORGS.firstdoor.name,
    ORGS.firstdoor.slug,
  );

  const orgIds: Record<DemoUserSpec["org"], string> = {
    cgds: cgds.id,
    contoso: contoso.id,
    firstdoor: firstdoor.id,
  };

  const users: Record<string, EnsuredUser> = {};
  for (const spec of DEMO_USERS) {
    const ensured = await ensureUser(db, spec, password);
    users[spec.email.toLowerCase()] = ensured;
    await ensureMembership(orgRepo, orgIds[spec.org], ensured.id, spec.role);
  }

  return {
    orgs: { cgds, contoso, firstdoor },
    users,
  };
}
