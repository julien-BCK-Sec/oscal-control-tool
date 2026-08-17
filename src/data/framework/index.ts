export type {
  Framework,
  FrameworkControl,
  FrameworkDescriptor,
  FrameworkProvider,
  FrameworkRegistry,
} from "./types";
export {
  createGeneratedFrameworkProvider,
  createNistModerateFrameworkProvider,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
} from "./provider";
export {
  DEFAULT_FRAMEWORK_ID,
  UnknownFrameworkError,
  frameworkRegistry,
  isFrameworkControlId,
  isRegisteredFrameworkId,
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
