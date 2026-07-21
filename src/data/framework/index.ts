export type {
  Framework,
  FrameworkControl,
  FrameworkProvider,
} from "./types";
export {
  createNistModerateFrameworkProvider,
  nistModerateFrameworkProvider,
} from "./provider";

import { nistModerateFrameworkProvider } from "./provider";

/**
 * Default application framework from the NIST Moderate FrameworkProvider.
 * Derived at build time from the pinned profile + catalog.
 */
export const FRAMEWORK = nistModerateFrameworkProvider.getFramework();

/**
 * Read-only controls for the current framework.
 * Prefer FRAMEWORK / FrameworkProvider for new code.
 */
export const FRAMEWORK_CONTROLS = FRAMEWORK.controls;
