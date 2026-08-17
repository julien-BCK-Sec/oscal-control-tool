/**
 * Durable application identities and OSCAL export metadata for the pinned
 * NIST SP 800-53 Rev. 5 Low / Moderate / High profiles.
 *
 * These IDs are persisted on projects. Do not use display names as identifiers.
 */

const OSCAL_CONTENT_PIN =
  "78650f02ad9321bb7b817846f8fbd4f2bcd620de";
const OSCAL_CONTENT_PROFILE_BASE = `https://raw.githubusercontent.com/usnistgov/oscal-content/${OSCAL_CONTENT_PIN}/nist.gov/SP800-53/rev5/json`;

export const NIST_OSCAL_PROVIDER = "nist-oscal";
export const NIST_SP80053_CATALOG_NAME = "NIST SP 800-53";
export const NIST_SP80053_REVISION_LABEL = "Rev. 5";
export const NIST_SP80053_OSCAL_PROFILE_MEDIA_TYPE =
  "application/oscal.profile+json";

export const NIST_LOW_FRAMEWORK_ID = "nist-sp-800-53-rev5-low";
export const NIST_MODERATE_FRAMEWORK_ID = "nist-sp-800-53-rev5-moderate";
export const NIST_HIGH_FRAMEWORK_ID = "nist-sp-800-53-rev5-high";

/** Backward-friendly default for project creation. */
export const DEFAULT_FRAMEWORK_ID = NIST_MODERATE_FRAMEWORK_ID;

export type NistSp80053Rev5FrameworkId =
  | typeof NIST_LOW_FRAMEWORK_ID
  | typeof NIST_MODERATE_FRAMEWORK_ID
  | typeof NIST_HIGH_FRAMEWORK_ID;

export type NistSp80053Rev5Identity = {
  id: NistSp80053Rev5FrameworkId;
  title: string;
  source: string;
  catalog: string;
  revision: string;
  profile: string;
  provider: string;
  oscalProfileTitle: string;
  oscalProfileUri: string;
  oscalProfileMediaType: string;
  vendorProfileFile: string;
  generatedJsonFile: string;
};

export const NIST_LOW_IDENTITY: NistSp80053Rev5Identity = {
  id: NIST_LOW_FRAMEWORK_ID,
  title: "NIST SP 800-53 Revision 5 Low Baseline",
  source: "NIST SP 800-53 Rev. 5 Low",
  catalog: NIST_SP80053_CATALOG_NAME,
  revision: NIST_SP80053_REVISION_LABEL,
  profile: "Low",
  provider: NIST_OSCAL_PROVIDER,
  oscalProfileTitle: "NIST SP 800-53 Revision 5 Low Baseline Profile",
  oscalProfileUri: `${OSCAL_CONTENT_PROFILE_BASE}/NIST_SP-800-53_rev5_LOW-baseline_profile.json`,
  oscalProfileMediaType: NIST_SP80053_OSCAL_PROFILE_MEDIA_TYPE,
  vendorProfileFile: "NIST_SP-800-53_rev5_LOW-baseline_profile.json",
  generatedJsonFile: "nist-sp-800-53-rev5-low.json",
};

export const NIST_MODERATE_IDENTITY: NistSp80053Rev5Identity = {
  id: NIST_MODERATE_FRAMEWORK_ID,
  title: "NIST SP 800-53 Revision 5 Moderate Baseline",
  source: "NIST SP 800-53 Rev. 5 Moderate",
  catalog: NIST_SP80053_CATALOG_NAME,
  revision: NIST_SP80053_REVISION_LABEL,
  profile: "Moderate",
  provider: NIST_OSCAL_PROVIDER,
  oscalProfileTitle: "NIST SP 800-53 Revision 5 Moderate Baseline Profile",
  oscalProfileUri: `${OSCAL_CONTENT_PROFILE_BASE}/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json`,
  oscalProfileMediaType: NIST_SP80053_OSCAL_PROFILE_MEDIA_TYPE,
  vendorProfileFile: "NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
  generatedJsonFile: "nist-sp-800-53-rev5-moderate.json",
};

export const NIST_HIGH_IDENTITY: NistSp80053Rev5Identity = {
  id: NIST_HIGH_FRAMEWORK_ID,
  title: "NIST SP 800-53 Revision 5 High Baseline",
  source: "NIST SP 800-53 Rev. 5 High",
  catalog: NIST_SP80053_CATALOG_NAME,
  revision: NIST_SP80053_REVISION_LABEL,
  profile: "High",
  provider: NIST_OSCAL_PROVIDER,
  oscalProfileTitle: "NIST SP 800-53 Revision 5 High Baseline Profile",
  oscalProfileUri: `${OSCAL_CONTENT_PROFILE_BASE}/NIST_SP-800-53_rev5_HIGH-baseline_profile.json`,
  oscalProfileMediaType: NIST_SP80053_OSCAL_PROFILE_MEDIA_TYPE,
  vendorProfileFile: "NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
  generatedJsonFile: "nist-sp-800-53-rev5-high.json",
};

export const NIST_SP80053_REV5_IDENTITIES: readonly NistSp80053Rev5Identity[] = [
  NIST_LOW_IDENTITY,
  NIST_MODERATE_IDENTITY,
  NIST_HIGH_IDENTITY,
];

export function findFrameworkIdentity(
  frameworkId: string,
): NistSp80053Rev5Identity | undefined {
  const id = frameworkId.trim();
  return NIST_SP80053_REV5_IDENTITIES.find((entry) => entry.id === id);
}

export function requireFrameworkIdentity(
  frameworkId: string,
): NistSp80053Rev5Identity {
  const identity = findFrameworkIdentity(frameworkId);
  if (!identity) {
    throw new Error(
      `Unknown framework: ${frameworkId.trim() || "(empty)"}`,
    );
  }
  return identity;
}

export const NIST_MODERATE_FRAMEWORK_SOURCE = NIST_MODERATE_IDENTITY.source;
export const NIST_MODERATE_FRAMEWORK_TITLE = NIST_MODERATE_IDENTITY.title;
