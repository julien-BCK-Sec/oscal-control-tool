/**
 * Durable identity and source-version labels for the DoD Cloud IL4 (Rev. 5)
 * Moderate / MMx derived artifact.
 *
 * `id` is the approved immutable framework identity (ADR-029). Do not encode
 * Addendum v1.2, Y26M06, or retrieval dates in this string.
 *
 * WP2 produces the generated overlay artifact. WP3 registers the provider.
 * WP4 exposes it for new projects (`productSelectable: true`) after the
 * overlay authoring presentation exists.
 */

export const DOD_CLOUD_IL4_FRAMEWORK_ID = "dod-cloud-il4-rev5" as const;

export const DOD_CLOUD_IL4_TITLE =
  "DoD Cloud Impact Level 4 (Rev. 5, Moderate / MMx)";

export const DOD_CLOUD_IL4_PRESENTATION_TITLE = "DoD Cloud Impact Level 4";

export const DOD_CLOUD_IL4_SOURCE =
  "DoD Cloud Impact Level 4 (FedRAMP Rev. 5 Moderate + DoD IL4 overlay)";

export const DOD_CLOUD_IL4_CATALOG = "DoD Cloud";
/** Supporting revision label. Not part of the selector family group heading. */
export const DOD_CLOUD_IL4_REVISION = "Rev. 5";
export const DOD_CLOUD_IL4_PROFILE = "Impact Level 4";
export const DOD_CLOUD_IL4_PROVIDER = "dod-cloud-overlay";

export const DOD_GRR_FAMILY = "DoD General Readiness Requirements";

export const DOD_CLOUD_IL4_GENERATED_JSON_FILE = "dod-cloud-il4-rev5.json";

export const FEDRAMP_MODERATE_BASE_COUNT = 181;
export const FEDRAMP_MODERATE_ENHANCEMENT_COUNT = 142;
export const FEDRAMP_MODERATE_TOTAL_COUNT = 323;

export const IL4_NIST_BASE_COUNT = 183;
export const IL4_NIST_ENHANCEMENT_COUNT = 152;
export const IL4_GRR_COUNT = 10;
export const IL4_TOTAL_COUNT = 345;

export const DOD_ADDED_NIST_BASE_IDS = ["sc-24", "sc-46"] as const;

export const DOD_ADDED_NIST_ENHANCEMENT_IDS = [
  "au-5.1",
  "ma-5.5",
  "ps-3.4",
  "sa-4.5",
  "sa-9.3",
  "sa-9.6",
  "sa-9.7",
  "sa-9.8",
  "sc-12.6",
  "sc-18.2",
] as const;

export const GRR_IDS = [
  "grr-1",
  "grr-2",
  "grr-3",
  "grr-4",
  "grr-5",
  "grr-6",
  "grr-7",
  "grr-8",
  "grr-9",
  "grr-10",
] as const;

export type DodCloudIl4FrameworkId = typeof DOD_CLOUD_IL4_FRAMEWORK_ID;

export type DodCloudIl4Identity = {
  id: DodCloudIl4FrameworkId;
  title: string;
  source: string;
  catalog: string;
  revision: string;
  profile: string;
  provider: string;
  itemSingular: "control";
  itemPlural: "controls";
  productSelectable: true;
  generatedJsonFile: string;
};

export const DOD_CLOUD_IL4_IDENTITY: DodCloudIl4Identity = {
  id: DOD_CLOUD_IL4_FRAMEWORK_ID,
  title: DOD_CLOUD_IL4_PRESENTATION_TITLE,
  source: DOD_CLOUD_IL4_SOURCE,
  catalog: DOD_CLOUD_IL4_CATALOG,
  revision: "",
  profile: DOD_CLOUD_IL4_PROFILE,
  provider: DOD_CLOUD_IL4_PROVIDER,
  itemSingular: "control",
  itemPlural: "controls",
  productSelectable: true,
  generatedJsonFile: DOD_CLOUD_IL4_GENERATED_JSON_FILE,
};
