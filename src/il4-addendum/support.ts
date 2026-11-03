import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";

export const IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE =
  "IL4 Addendum export is available only for DoD Cloud Impact Level 4 projects.";

export function supportsIl4AddendumExport(frameworkId: string): boolean {
  return frameworkId === DOD_CLOUD_IL4_FRAMEWORK_ID;
}
