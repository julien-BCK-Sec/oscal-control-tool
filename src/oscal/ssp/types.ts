/**
 * Minimal OSCAL SSP JSON shapes used by this exporter.
 * This is not a complete OSCAL schema — only the fields we emit.
 */

export type OscalImplementationStatusState =
  | "implemented"
  | "partial"
  | "planned"
  | "alternative"
  | "not-applicable";

export type OscalRole = {
  id: string;
  title: string;
};

export type OscalParty = {
  uuid: string;
  type: "organization" | "person";
  name: string;
  "email-addresses"?: string[];
  "telephone-numbers"?: Array<{ number: string }>;
  remarks?: string;
};

export type OscalMetadata = {
  title: string;
  "last-modified": string;
  version: string;
  "oscal-version": string;
  roles?: OscalRole[];
  parties?: OscalParty[];
};

export type OscalSystemId = {
  "identifier-type"?: string;
  id: string;
};

export type OscalImpact = {
  base: string;
};

export type OscalInformationType = {
  uuid: string;
  title: string;
  description: string;
  "confidentiality-impact"?: OscalImpact;
  "integrity-impact"?: OscalImpact;
  "availability-impact"?: OscalImpact;
};

export type OscalSystemCharacteristics = {
  "system-ids": OscalSystemId[];
  "system-name": string;
  "system-name-short"?: string;
  description: string;
  "system-information": {
    "information-types": OscalInformationType[];
  };
  "security-impact-level"?: {
    "security-objective-confidentiality": string;
    "security-objective-integrity": string;
    "security-objective-availability": string;
  };
  status: {
    state:
      | "operational"
      | "under-development"
      | "under-major-modification"
      | "disposition"
      | "other";
    remarks?: string;
  };
  "authorization-boundary": {
    description: string;
  };
  "responsible-parties"?: Array<{
    "role-id": string;
    "party-uuids": string[];
  }>;
};

export type OscalComponent = {
  uuid: string;
  type: "this-system";
  title: string;
  description: string;
  status: {
    state: "operational" | "under-development" | "other";
  };
};

export type OscalByComponent = {
  "component-uuid": string;
  uuid: string;
  description: string;
  "implementation-status"?: {
    state: OscalImplementationStatusState;
  };
};

export type OscalImplementedRequirement = {
  uuid: string;
  "control-id": string;
  "by-components": OscalByComponent[];
};

export type OscalBackMatterRlink = {
  href: string;
  "media-type"?: string;
};

export type OscalBackMatterResource = {
  uuid: string;
  title?: string;
  description: string;
  rlinks?: OscalBackMatterRlink[];
};

export type OscalSystemSecurityPlan = {
  uuid: string;
  metadata: OscalMetadata;
  "import-profile": {
    href: string;
  };
  "system-characteristics": OscalSystemCharacteristics;
  "system-implementation": {
    components: OscalComponent[];
  };
  "control-implementation": {
    description: string;
    "implemented-requirements": OscalImplementedRequirement[];
  };
  "back-matter": {
    resources: OscalBackMatterResource[];
  };
};

export type OscalSspDocument = {
  "system-security-plan": OscalSystemSecurityPlan;
};
