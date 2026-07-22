import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";
import * as authSchema from "@/persistence/postgres/auth-schema";
import { ORG_ROLES } from "@/authz/permissions";
import { getAuthDb } from "./db";
import { deliverAuthEmail } from "./email";

/** Seven days, in seconds (ADR-018). */
const INVITATION_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

/**
 * Better Auth access-control roles matching ADR-017. Control Freak owns the
 * authoritative permission matrix (`src/authz`); these role definitions only
 * gate Better Auth's own organization endpoints. Administrative roles may act
 * on organization/member/invitation resources; authoring/review roles are
 * read-only at the Better Auth layer.
 */
const ac = createAccessControl(defaultStatements);

const adminStatements = {
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  ac: ["read"],
} as const;

const readonlyStatements = { ac: ["read"] } as const;

const roles = {
  organization_admin: ac.newRole({ ...adminStatements }),
  project_manager: ac.newRole({ ...readonlyStatements }),
  author: ac.newRole({ ...readonlyStatements }),
  reviewer: ac.newRole({ ...readonlyStatements }),
  viewer: ac.newRole({ ...readonlyStatements }),
} satisfies Record<(typeof ORG_ROLES)[number], unknown>;

/**
 * Resolve the Better Auth signing secret. Fails closed at production runtime
 * (never a silent default); permits an ephemeral value during `next build` and
 * local development so the app can be built without secrets in the image.
 */
function resolveAuthSecret(): string {
  const configured = process.env.BETTER_AUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }
  const isProductionRuntime =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build";
  if (isProductionRuntime) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set in production. Refusing to start with an insecure default.",
    );
  }
  return "development-only-insecure-secret-change-me";
}

function resolveBaseUrl(): string | undefined {
  return (
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    undefined
  );
}

/**
 * Build the Better Auth instance. Kept as a factory so the concrete inferred
 * type (including the organization plugin's contributions) flows through
 * `getAuth()` and its consumers, rather than the widened base `Auth` type.
 */
function createAuthInstance() {
  const isProduction = process.env.NODE_ENV === "production";
  return betterAuth({
    appName: "Control Freak",
    baseURL: resolveBaseUrl(),
    secret: resolveAuthSecret(),
    database: drizzleAdapter(getAuthDb(), {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      // Invite-only after bootstrap (ADR-015/019). No public self-registration.
      disableSignUp: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      async sendVerificationEmail({ user, url }) {
        deliverAuthEmail({ type: "email-verification", to: user.email, url });
      },
    },
    advanced: {
      useSecureCookies: isProduction,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
      },
    },
    plugins: [
      organization({
        ac,
        roles,
        creatorRole: "organization_admin",
        // Organizations are created only by the documented bootstrap process
        // (ADR-019); never by end users.
        allowUserToCreateOrganization: false,
        invitationExpiresIn: INVITATION_EXPIRES_IN_SECONDS,
        cancelPendingInvitationsOnReInvite: true,
        requireEmailVerificationOnInvitation: true,
        async sendInvitationEmail(data) {
          const base = resolveBaseUrl() ?? "";
          deliverAuthEmail({
            type: "organization-invitation",
            to: data.email,
            url: `${base}/invitations/${data.id}`,
          });
        },
      }),
      // nextCookies must be the last plugin so it can persist Set-Cookie headers.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuthInstance>;

let cached: Auth | null = null;

/**
 * Lazily construct the Better Auth instance. Deferred (not created at module
 * import) so `next build` never requires a live database or secrets.
 */
export function getAuth(): Auth {
  if (!cached) {
    cached = createAuthInstance();
  }
  return cached;
}
