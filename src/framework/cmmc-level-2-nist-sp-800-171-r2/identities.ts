/**
 * Durable application identity for CMMC Level 2 as adopted from NIST SP
 * 800-171 Revision 2 (32 CFR Part 170). Persisted on projects.
 */

export const CMMC_LEVEL_2_FRAMEWORK_ID =
  "cmmc-level-2-nist-sp-800-171-r2" as const;

export const CMMC_NIST_800_171_PROVIDER = "cmmc-nist-800-171";
export const CMMC_CATALOG_NAME = "CMMC";
export const CMMC_PROFILE_LABEL = "Level 2";
export const CMMC_SOURCE_VERSION = "r2-2021-01-28";

export type CmmcLevel2FrameworkId = typeof CMMC_LEVEL_2_FRAMEWORK_ID;

export type CmmcLevel2Identity = {
  id: CmmcLevel2FrameworkId;
  title: string;
  source: string;
  catalog: string;
  revision: string;
  profile: string;
  provider: string;
  sourceVersion: string;
  itemSingular: "requirement";
  itemPlural: "requirements";
  generatedJsonFile: string;
  vendorCsvFile: string;
};

export const CMMC_LEVEL_2_IDENTITY: CmmcLevel2Identity = {
  id: CMMC_LEVEL_2_FRAMEWORK_ID,
  title: "CMMC Level 2 (NIST SP 800-171 Rev. 2)",
  source: "CMMC Level 2 / NIST SP 800-171 Rev. 2",
  catalog: CMMC_CATALOG_NAME,
  revision: "",
  profile: CMMC_PROFILE_LABEL,
  provider: CMMC_NIST_800_171_PROVIDER,
  sourceVersion: CMMC_SOURCE_VERSION,
  itemSingular: "requirement",
  itemPlural: "requirements",
  generatedJsonFile: "cmmc-level-2-nist-sp-800-171-r2.json",
  vendorCsvFile: "sp800-171r2-security-reqs.csv",
};
