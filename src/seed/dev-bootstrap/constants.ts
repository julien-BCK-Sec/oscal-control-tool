/**
 * Developer demo bootstrap constants.
 *
 * Canonical organization/project names live in `src/seed/demo/catalog.ts`.
 * Olivia's "Contributor" role maps to `author` (fixed Milestone 1 role set).
 */

import type { OrgRole } from "@/authz/permissions";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "@/seed/demo/catalog";

/** Local-development default only. Production/demo deploy must set DEMO_BOOTSTRAP_PASSWORD. */
export const DEFAULT_LOCAL_DEMO_PASSWORD = "ControlFreakDemo123!" as const;

/** @deprecated Use resolveDemoBootstrapPassword(). Kept for local DX and tests. */
export const DEMO_PASSWORD = DEFAULT_LOCAL_DEMO_PASSWORD;

export const FRAMEWORK_ID = NIST_MODERATE_FRAMEWORK_ID;

export const ORGS = {
  cgds: CANONICAL_ORGS.cgds,
  contoso: CANONICAL_ORGS.contoso,
  firstdoor: CANONICAL_ORGS.firstdoor,
} as const;

export type DemoOrgKey = keyof typeof ORGS;

export type DemoUserSpec = {
  name: string;
  email: string;
  /** Application RBAC role (Olivia Contributor → author). */
  role: OrgRole;
  org: DemoOrgKey;
};

export const DEMO_USERS: readonly DemoUserSpec[] = [
  {
    name: "Alice Admin",
    email: "alice@example.com",
    role: "organization_admin",
    org: "cgds",
  },
  {
    name: "Bob Manager",
    email: "bob@example.com",
    role: "project_manager",
    org: "cgds",
  },
  {
    name: "Carol Author",
    email: "carol@example.com",
    role: "author",
    org: "cgds",
  },
  {
    name: "Dave Reviewer",
    email: "dave@example.com",
    role: "reviewer",
    org: "cgds",
  },
  {
    name: "Victor Viewer",
    email: "victor@example.com",
    role: "viewer",
    org: "cgds",
  },
  {
    name: "Olivia Operator",
    email: "olivia@example.com",
    role: "author",
    org: "cgds",
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
  {
    name: "Julien",
    email: "julien@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
  {
    name: "Isabel",
    email: "isabel@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
  {
    name: "Ruth",
    email: "ruth@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
  {
    name: "Jason",
    email: "jason@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
  {
    name: "Michael",
    email: "michael@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
  {
    name: "Chad",
    email: "chad@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
  {
    name: "Test User",
    email: "test@example.com",
    role: "organization_admin",
    org: "firstdoor",
  },
] as const;

export const PROJECT_NAMES = {
  flagship: CANONICAL_PROJECTS.flagship.name,
  cmmc: CANONICAL_PROJECTS.cmmc.name,
  early: CANONICAL_PROJECTS.early.name,
  evidenceGap: CANONICAL_PROJECTS.evidenceGap.name,
  high: CANONICAL_PROJECTS.high.name,
  contosoCloud: CANONICAL_PROJECTS.contosoCloud.name,
  firstdoorCloud: CANONICAL_PROJECTS.firstdoorCloud.name,
} as const;

/** Featured controls that receive rich collaboration on the Goose flagship. */
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

export {
  demoSeedMarker,
  hasDemoSeedMarker,
} from "@/seed/demo/markers";
