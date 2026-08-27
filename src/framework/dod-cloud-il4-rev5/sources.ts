/**
 * Pinned hashes and vendor paths for DoD IL4 derivation (WP2).
 * Authoritative narrative lives in vendor/dod/cloud-il4-rev5/SOURCES.md.
 */

export const FEDRAMP_BASELINE_VENDOR_FILE =
  "vendor/dod/cloud-il4-rev5/FedRAMP_Security_Controls_Baseline.xlsx";

export const FEDRAMP_BASELINE_SHA256 =
  "fa3282f0f31356d8b001c64fcc105091826f0de88a294e380afd1e0b56a9830c";

export const ADDENDUM_EXTRACT_VENDOR_FILE =
  "vendor/dod/cloud-il4-rev5/extracts/addendum-il4-moderate.json";

export const ADDENDUM_WORKBOOK_SHA256 =
  "80475917868603d65c01a0e82be7cdd9e12095ea08047b397a8244a9177b6fcd";

export const APPENDIX_D_EXTRACT_VENDOR_FILE =
  "vendor/dod/cloud-il4-rev5/extracts/appendix-d-il4-parameter-notes.json";

export const CSP_SRG_V1R7_PDF_SHA256 =
  "fcb472f563283f293e224fcf72987584deb6019482a264a6536c2d5c1a5df51f";

export const CC_SRG_Y26M06_ZIP_SHA256 =
  "9470b9caadd3ff44b90e608c524012fa719c9b3541b3f0bb027b38b5b9e67971";

export const NIST_CATALOG_VENDOR_FILE =
  "vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json";

export const NIST_CATALOG_SHA256 =
  "01f37cf90ea99d92242c936cbfbdebcc338eef1f71454e2acac36cc56e9bc062";

export const NIST_MODERATE_PROFILE_VENDOR_FILE =
  "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json";

/** Default local Addendum path used only to regenerate the extract. */
export const ADDENDUM_LOCAL_CANDIDATES = [
  "vendor/dod/cloud-il4-rev5/local/rev5_ssp_addendum_controls.xlsx",
  // Developer copy from DCCS; never committed.
] as const;
