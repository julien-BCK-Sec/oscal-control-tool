import type { Framework, FrameworkProvider } from "@/data/framework/types";
import generated from "@/data/framework/generated/nist-sp-800-53-rev5-moderate.json";

/**
 * FrameworkProvider backed by the build-time derived NIST Moderate control set.
 * The browser never loads the raw OSCAL profile or catalog.
 */
export function createNistModerateFrameworkProvider(
  framework: Framework = generated as Framework,
): FrameworkProvider {
  return {
    getFramework(): Framework {
      return framework;
    },
  };
}

/** Default provider used by the application. */
export const nistModerateFrameworkProvider: FrameworkProvider =
  createNistModerateFrameworkProvider();
