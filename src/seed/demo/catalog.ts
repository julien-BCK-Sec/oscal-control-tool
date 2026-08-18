/**
 * Canonical demo organizations and projects.
 *
 * Identity lives here so bootstrap:demo and db:seed:demo cannot drift.
 * Framework IDs are the registered runtime identities (ADR-026).
 */

import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import { DEMO_ORGANIZATION, DEMO_SYSTEM } from "./world";
import { DEMO_PROJECT_NAME } from "./constants";

export const CANONICAL_ORGS = {
  cgds: {
    name: DEMO_ORGANIZATION.name,
    slug: "canadian-goose-defence-system",
    shortName: DEMO_ORGANIZATION.shortName,
  },
  contoso: {
    name: "Contoso Industries",
    slug: "contoso-industries",
  },
  firstdoor: {
    name: "FirstDoor",
    slug: "firstdoor",
  },
} as const;

/**
 * Acme Corporation was generic bootstrap scaffolding that hosted a
 * misnamed Goose project. It is no longer created. Existing local Acme
 * rows are left in place (routine bootstrap never deletes organizations).
 */
export const DEPRECATED_BOOTSTRAP_ORGS = {
  acme: {
    name: "Acme Corporation",
    slug: "acme-corporation",
  },
} as const;

export type CanonicalProjectKey =
  | "flagship"
  | "cmmc"
  | "early"
  | "evidenceGap"
  | "high"
  | "contosoCloud"
  | "firstdoorCloud";

export type CanonicalProjectSpec = {
  key: CanonicalProjectKey;
  name: string;
  organization: keyof typeof CANONICAL_ORGS;
  frameworkId: string;
  systemName: string;
  maturity:
    | "flagship"
    | "partial-cmmc"
    | "early-stage"
    | "evidence-gap"
    | "high-baseline"
    | "tenant-isolation"
    | "operator-demo";
  purpose: string;
};

export const CANONICAL_PROJECTS: Record<
  CanonicalProjectKey,
  CanonicalProjectSpec
> = {
  flagship: {
    key: "flagship",
    name: DEMO_PROJECT_NAME,
    organization: "cgds",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    systemName: DEMO_SYSTEM.name,
    maturity: "flagship",
    purpose:
      "Showcase NIST SP 800-53 Rev. 5 Moderate authoring: complete baseline implementations, named versions, collaboration, and strong Evidence Coverage.",
  },
  cmmc: {
    key: "cmmc",
    name: "Border Goose Squadron CUI Enclave (Demo)",
    organization: "cgds",
    frameworkId: CMMC_LEVEL_2_FRAMEWORK_ID,
    systemName: "Border Goose Squadron CUI Enclave",
    maturity: "partial-cmmc",
    purpose:
      "Demonstrate CMMC Level 2 / NIST SP 800-171 Rev. 2 (110 requirements) with partial implementation progress and incomplete work remaining.",
  },
  early: {
    key: "early",
    name: "Honkwater Visitor Network (Demo)",
    organization: "cgds",
    frameworkId: NIST_LOW_FRAMEWORK_ID,
    systemName: "Honkwater Visitor Network",
    maturity: "early-stage",
    purpose:
      "Early-stage NIST SP 800-53 Rev. 5 Low system with valid metadata and almost no completed control work.",
  },
  evidenceGap: {
    key: "evidenceGap",
    name: "Coconut Logistics Inventory System (Demo)",
    organization: "cgds",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    systemName: "Coconut Logistics Inventory System",
    maturity: "evidence-gap",
    purpose:
      "Mature implementation narratives with intentionally weak Evidence Coverage, so documenting a control is distinct from substantiating it.",
  },
  high: {
    key: "high",
    name: "National Honk Operations Centre High Baseline (Demo)",
    organization: "cgds",
    frameworkId: NIST_HIGH_FRAMEWORK_ID,
    systemName: "National Honk Operations Centre High Baseline",
    maturity: "high-baseline",
    purpose:
      "NIST SP 800-53 Rev. 5 High profile with mid-maturity coverage, contrasting the Moderate flagship and Low early-stage projects.",
  },
  contosoCloud: {
    key: "contosoCloud",
    name: "Contoso Cloud Platform",
    organization: "contoso",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    systemName: "Contoso Cloud Platform",
    maturity: "tenant-isolation",
    purpose:
      "Second-tenant Moderate project used to demonstrate organization isolation. Not a CGDS system.",
  },
  firstdoorCloud: {
    key: "firstdoorCloud",
    name: "FirstDoor Platform (Demo)",
    organization: "firstdoor",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    systemName: "FirstDoor Platform",
    maturity: "operator-demo",
    purpose:
      "Operator-tenant NIST SP 800-53 Rev. 5 Moderate / FedRAMP Moderate sample project with placeholder implementation statements.",
  },
} as const;

export const CGDS_PROJECT_KEYS = [
  "flagship",
  "cmmc",
  "early",
  "evidenceGap",
  "high",
] as const satisfies readonly CanonicalProjectKey[];

export const SUPPORTING_PROJECT_KEYS = [
  "cmmc",
  "early",
  "evidenceGap",
  "high",
  "contosoCloud",
  "firstdoorCloud",
] as const satisfies readonly CanonicalProjectKey[];

export function canonicalProjectName(key: CanonicalProjectKey): string {
  return CANONICAL_PROJECTS[key].name;
}
