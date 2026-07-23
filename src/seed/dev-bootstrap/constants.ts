/**
 * Developer demo bootstrap constants (development only).
 *
 * Framework: NIST SP 800-53 Rev. 5 Moderate (the application's only pinned
 * baseline). The prompt's "FedRAMP Moderate" label maps to this framework
 * because no FedRAMP OSCAL profile is implemented (see ADR / standards docs).
 *
 * Olivia's "Contributor" role maps to `author` (fixed Milestone 1 role set).
 */

import type { OrgRole } from "@/authz/permissions";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";

export const DEMO_PASSWORD = "ControlFreakDemo123!" as const;

export const FRAMEWORK_ID = NIST_MODERATE_FRAMEWORK_ID;

export const ORGS = {
  acme: {
    name: "Acme Corporation",
    slug: "acme-corporation",
  },
  contoso: {
    name: "Contoso Industries",
    slug: "contoso-industries",
  },
} as const;

export type DemoUserSpec = {
  name: string;
  email: string;
  /** Application RBAC role (Olivia Contributor → author). */
  role: OrgRole;
  org: keyof typeof ORGS;
};

export const DEMO_USERS: readonly DemoUserSpec[] = [
  {
    name: "Alice Admin",
    email: "alice@example.com",
    role: "organization_admin",
    org: "acme",
  },
  {
    name: "Bob Manager",
    email: "bob@example.com",
    role: "project_manager",
    org: "acme",
  },
  {
    name: "Carol Author",
    email: "carol@example.com",
    role: "author",
    org: "acme",
  },
  {
    name: "Dave Reviewer",
    email: "dave@example.com",
    role: "reviewer",
    org: "acme",
  },
  {
    name: "Victor Viewer",
    email: "victor@example.com",
    role: "viewer",
    org: "acme",
  },
  {
    name: "Olivia Operator",
    email: "olivia@example.com",
    role: "author", // Contributor → author
    org: "acme",
  },
  {
    name: "Oscar Admin",
    email: "oscar@example.com",
    role: "organization_admin",
    org: "contoso",
  },
  {
    name: "Rachel Reviewer",
    email: "rachel@example.com",
    role: "reviewer",
    org: "contoso",
  },
] as const;

export const PROJECT_NAMES = {
  goose: "Goose Command Control Center",
  customerA: "Customer A SSP",
  lab: "Internal Lab Environment",
  contosoCloud: "Contoso Cloud Platform",
} as const;

/** Featured controls that receive rich collaboration on Goose. */
export const GOOSE_FEATURED_CONTROLS = [
  "ac-2",
  "ia-2",
  "ia-5",
  "au-2",
  "au-6",
  "sc-7",
  "si-4",
  "cm-2",
] as const;

/** Stable seed markers embedded in comment bodies for idempotent collab. */
export function demoSeedMarker(key: string): string {
  return `\n\n<!-- demo-seed:${key} -->`;
}

export function hasDemoSeedMarker(body: string, key: string): boolean {
  return body.includes(`<!-- demo-seed:${key} -->`);
}
