export type {
  Framework,
  FrameworkApplicability,
  FrameworkAuthoritativeValueStatus,
  FrameworkControl,
  FrameworkDescriptor,
  FrameworkItemKind,
  FrameworkOrganizationDefinedParameter,
  FrameworkParameterMetadata,
  FrameworkParameterSelect,
  FrameworkProvenanceText,
  FrameworkProvider,
  FrameworkRegistry,
  FrameworkSelectionProvenance,
} from "./types";
export {
  createGeneratedFrameworkProvider,
  createNistModerateFrameworkProvider,
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
} from "./provider";
export {
  DEFAULT_FRAMEWORK_ID,
  UnknownFrameworkError,
  assertProductSelectableFrameworkId,
  frameworkRegistry,
  isFrameworkControlId,
  isProductSelectableFramework,
  isProductSelectableFrameworkId,
  isRegisteredFrameworkId,
  listProductSelectableFrameworks,
  resolveFramework,
  resolveFrameworkControlIdSet,
  resolveFrameworkControls,
} from "./registry";

import { nistModerateFrameworkProvider } from "./provider";

/**
 * NIST SP 800-53 Rev. 5 Moderate framework.
 *
 * Runtime project views must resolve the project's `frameworkId` via
 * `frameworkRegistry` / `resolveFramework` instead of this constant.
 * Tests and Moderate-specific derivation may import it explicitly.
 */
export const FRAMEWORK = nistModerateFrameworkProvider.getFramework();

/**
 * Moderate control list. Prefer `resolveFrameworkControls(frameworkId)`
 * for project-scoped runtime paths.
 */
export const FRAMEWORK_CONTROLS = FRAMEWORK.controls;
