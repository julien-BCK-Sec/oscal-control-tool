import type { ProjectMetadata } from "./types";

/** Empty defaults when no project metadata has been entered or stored. */
export const DEFAULT_PROJECT_METADATA: ProjectMetadata = {
  systemName: "",
  organizationName: "",
  systemDescription: "",
  systemNameShort: "",
  systemIdentifier: "",
  authorizationBoundary: "",
  environmentOfOperation: "",
  operationalStatus: "",
  operationalStatusRemarks: "",
  securityCategorization: null,
  dodCloudImpactLevel: null,
  systemRoles: [],
  informationTypes: [],
  interconnections: [],
};
