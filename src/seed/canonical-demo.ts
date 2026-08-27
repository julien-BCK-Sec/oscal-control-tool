import type { AppDatabase } from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { ensureCanonicalDemoEvidence } from "@/seed/demo/evidence-seed";
import { DEMO_USERS, ORGS } from "@/seed/dev-bootstrap/constants";
import { ensureDemoCollaboration } from "@/seed/dev-bootstrap/collaboration";
import {
  ensureDemoIdentity,
  type BootstrapIdentityResult,
} from "@/seed/dev-bootstrap/identity";
import {
  ensureDemoProjects,
  type DemoProjectsResult,
} from "@/seed/dev-bootstrap/projects";

/**
 * Shared canonical Milestone 05A demo environment.
 *
 * Used by:
 * - local `npm run bootstrap:demo` (after local-only env/safety steps)
 * - production `DEPLOYMENT_MODE=demo` startup
 *
 * Idempotent. Never truncates. Does not write `.env.local`, assume localhost,
 * or print passwords.
 */
export type CanonicalDemoResult = {
  identity: BootstrapIdentityResult;
  projects: DemoProjectsResult;
  commentsCreated: number;
  assignmentsCreated: number;
  evidenceCreated: number;
};

export async function ensureCanonicalDemoEnvironment(
  db: AppDatabase,
  options: {
    validateOscal?: boolean;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<CanonicalDemoResult> {
  const identity = await ensureDemoIdentity(db, options.env);

  const projects = await ensureDemoProjects(
    createPostgresProjectRepository(db),
    {
      cgds: identity.orgs.cgds.id,
      contoso: identity.orgs.contoso.id,
      firstdoor: identity.orgs.firstdoor.id,
    },
    { validateOscal: options.validateOscal },
  );

  const collab = await ensureDemoCollaboration({
    db,
    users: identity.users,
    cgdsOrgId: identity.orgs.cgds.id,
    contosoOrgId: identity.orgs.contoso.id,
    flagship: projects.flagship,
    cmmc: projects.cmmc,
    early: projects.early,
    evidenceGap: projects.evidenceGap,
    high: projects.high,
    contosoCloud: projects.contosoCloud,
  });

  const bob = identity.users["bob@example.com"];
  const evidence = await ensureCanonicalDemoEvidence({
    db,
    projects: {
      flagshipId: projects.flagship.id,
      cmmcId: projects.cmmc.id,
      earlyId: projects.early.id,
      evidenceGapId: projects.evidenceGap.id,
      highId: projects.high.id,
      il4Id: projects.il4.id,
    },
    actor: bob
      ? { actorId: bob.id, actorDisplayName: bob.name }
      : { actorId: null, actorDisplayName: "System" },
  });

  const orgRepo = createPostgresOrganizationRepository(db);
  const membersByOrg: Record<(typeof DEMO_USERS)[number]["org"], Set<string>> = {
    cgds: new Set(
      (await orgRepo.listMembers(identity.orgs.cgds.id)).map((m) =>
        m.email.toLowerCase(),
      ),
    ),
    contoso: new Set(
      (await orgRepo.listMembers(identity.orgs.contoso.id)).map((m) =>
        m.email.toLowerCase(),
      ),
    ),
    firstdoor: new Set(
      (await orgRepo.listMembers(identity.orgs.firstdoor.id)).map((m) =>
        m.email.toLowerCase(),
      ),
    ),
  };
  for (const demoUser of DEMO_USERS) {
    const email = demoUser.email.toLowerCase();
    for (const orgKey of Object.keys(membersByOrg) as Array<
      (typeof DEMO_USERS)[number]["org"]
    >) {
      const belongs = membersByOrg[orgKey].has(email);
      if (orgKey === demoUser.org) {
        if (!belongs) {
          throw new Error(
            `Tenant isolation failed: ${email} missing from ${orgKey}.`,
          );
        }
      } else if (belongs) {
        throw new Error(
          `Tenant isolation failed: ${email} unexpectedly in ${orgKey}.`,
        );
      }
    }
  }

  return {
    identity,
    projects,
    commentsCreated: collab.commentsCreated,
    assignmentsCreated: collab.assignmentsCreated,
    evidenceCreated: evidence.created,
  };
}

export function canonicalDemoOrgNames(result: CanonicalDemoResult): string[] {
  const names: string[] = [];
  if (result.identity.orgs.cgds.created) names.push(ORGS.cgds.name);
  if (result.identity.orgs.contoso.created) names.push(ORGS.contoso.name);
  if (result.identity.orgs.firstdoor.created) names.push(ORGS.firstdoor.name);
  return names;
}

export function canonicalDemoUserEmails(result: CanonicalDemoResult): string[] {
  return Object.values(result.identity.users)
    .filter((user) => user.created)
    .map((user) => user.email);
}
