import { NIST_MODERATE_IDENTITY } from "@/framework/nist-sp-800-53-rev5/identities";

/** OSCAL version emitted by the SSP exporter (pinned NIST OSCAL release). */
export const OSCAL_VERSION = "1.2.2";

/** Document version string for exported SSP metadata. */
export const SSP_DOCUMENT_VERSION = "1.0";

/**
 * Commit-pinned upstream URI for the NIST SP 800-53 Rev. 5 Moderate profile.
 * Matches vendor/oscal/v1.2.2/SOURCES.md.
 *
 * Prefer resolving the project's framework identity at export time.
 * Kept for Moderate-specific tests and callers.
 */
export const NIST_SP80053_REV5_MODERATE_PROFILE_URI =
  NIST_MODERATE_IDENTITY.oscalProfileUri;

export const NIST_SP80053_REV5_MODERATE_PROFILE_TITLE =
  NIST_MODERATE_IDENTITY.oscalProfileTitle;

export const NIST_SP80053_REV5_MODERATE_PROFILE_MEDIA_TYPE =
  NIST_MODERATE_IDENTITY.oscalProfileMediaType;
