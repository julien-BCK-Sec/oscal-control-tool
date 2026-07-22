/**
 * Bootstrap the first organization administrator (ADR-015/019).
 *
 * Creates (idempotently) an email/password user with a verified email, an
 * organization, and an `organization_admin` membership. This is the documented
 * way to create the initial account because public self-registration is
 * disabled. It never seeds shared public credentials and never logs the
 * password.
 *
 * Usage:
 *   # Prefer values in .env.local (loaded automatically), or export:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
 *   BOOTSTRAP_ADMIN_PASSWORD='...' \
 *   BOOTSTRAP_ADMIN_NAME='Admin' \
 *   BOOTSTRAP_ORG_NAME='Demo Org' \
 *   BOOTSTRAP_ORG_SLUG='demo-org' \
 *   npm run bootstrap:admin
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import {
  closeDb,
  getDb,
  resolveDatabaseUrl,
} from "../src/persistence/postgres/client";
import { account, user } from "../src/persistence/postgres/auth-schema";
import { createPostgresOrganizationRepository } from "../src/persistence/postgres/organization-repository";
import { loadLocalEnv } from "./load-env";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

async function main(): Promise<void> {
  loadLocalEnv();
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to bootstrap the admin.");
  }

  const email = requireEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || email;
  const orgName = requireEnv("BOOTSTRAP_ORG_NAME");
  const orgSlug = requireEnv("BOOTSTRAP_ORG_SLUG").toLowerCase();

  if (password.length < 12) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.",
    );
  }

  const db = await getDb(databaseUrl);
  const orgRepo = createPostgresOrganizationRepository(db);

  // User (idempotent by email).
  let userRow = (
    await db.select().from(user).where(eq(user.email, email)).limit(1)
  )[0];
  if (!userRow) {
    const now = new Date();
    const userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name,
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
    userRow = (
      await db.select().from(user).where(eq(user.email, email)).limit(1)
    )[0];
    console.log(`Created admin user ${email}.`);
  } else {
    console.log(`Admin user ${email} already exists; reusing.`);
  }

  // Organization (idempotent by slug).
  let organization = await orgRepo.getOrganizationBySlug(orgSlug);
  if (!organization) {
    organization = await orgRepo.createOrganization({
      name: orgName,
      slug: orgSlug,
    });
    console.log(`Created organization "${orgName}" (${orgSlug}).`);
  } else {
    console.log(`Organization "${orgSlug}" already exists; reusing.`);
  }

  // Membership as organization_admin (idempotent).
  await orgRepo.upsertMembership({
    organizationId: organization.id,
    userId: userRow!.id,
    role: "organization_admin",
  });

  console.log("Bootstrap complete.");
  console.log(`  Organization id: ${organization.id}`);
  console.log(`  Organization slug: ${organization.slug}`);
  console.log(`  Admin email: ${email} (verified)`);
  console.log(
    "  Seed the demo project into this organization with:\n" +
      `    SEED_DEMO_ORG_SLUG=${organization.slug} npm run db:seed:demo`,
  );

  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
