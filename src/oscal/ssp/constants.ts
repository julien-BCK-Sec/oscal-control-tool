/** OSCAL version emitted by the SSP exporter (pinned NIST OSCAL release). */
export const OSCAL_VERSION = "1.2.2";

/** Document version string for exported SSP metadata. */
export const SSP_DOCUMENT_VERSION = "1.0";

/**
 * Commit-pinned upstream URI for the NIST SP 800-53 Rev. 5 Moderate profile.
 * Matches vendor/oscal/v1.2.2/SOURCES.md.
 *
 * Used in SSP back-matter rlinks for the current single-file export.
 * A future portable package should ship the profile (and catalog) locally
 * instead of relying on this external URI.
 */
export const NIST_SP80053_REV5_MODERATE_PROFILE_URI =
  "https://raw.githubusercontent.com/usnistgov/oscal-content/78650f02ad9321bb7b817846f8fbd4f2bcd620de/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json";

export const NIST_SP80053_REV5_MODERATE_PROFILE_TITLE =
  "NIST SP 800-53 Revision 5 Moderate Baseline Profile";

export const NIST_SP80053_REV5_MODERATE_PROFILE_MEDIA_TYPE =
  "application/oscal.profile+json";
