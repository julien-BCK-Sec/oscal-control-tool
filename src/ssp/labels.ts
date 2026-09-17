import type {
  DodCloudImpactLevel,
  FipsImpactLevel,
  InterconnectionDirection,
  SystemOperationalStatus,
  SystemRoleType,
} from "@/data/project";

export const FIPS_IMPACT_LABELS: Record<FipsImpactLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export const OPERATIONAL_STATUS_LABELS: Record<SystemOperationalStatus, string> =
  {
    "under-development": "Under development",
    operational: "Operational",
    "under-major-modification": "Under major modification",
    disposition: "Disposition",
    other: "Other",
  };

export const SYSTEM_ROLE_LABELS: Record<SystemRoleType, string> = {
  "system-owner": "System owner",
  "authorizing-official": "Authorizing official",
  "system-security-officer": "System security officer",
  other: "Other",
};

export const INTERCONNECTION_DIRECTION_LABELS: Record<
  InterconnectionDirection,
  string
> = {
  inbound: "Inbound",
  outbound: "Outbound",
  bidirectional: "Bidirectional",
};

export const DOD_CLOUD_IMPACT_LABELS: Record<DodCloudImpactLevel, string> = {
  il2: "IL2",
  il4: "IL4",
  il5: "IL5",
  il6: "IL6",
};
