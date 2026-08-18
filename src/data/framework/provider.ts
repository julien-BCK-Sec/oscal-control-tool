import type { Framework, FrameworkProvider } from "@/data/framework/types";
import generatedLow from "@/data/framework/generated/nist-sp-800-53-rev5-low.json";
import generatedModerate from "@/data/framework/generated/nist-sp-800-53-rev5-moderate.json";
import generatedHigh from "@/data/framework/generated/nist-sp-800-53-rev5-high.json";
import generatedCmmcLevel2 from "@/data/framework/generated/cmmc-level-2-nist-sp-800-171-r2.json";

/**
 * FrameworkProvider backed by a build-time derived application JSON document.
 * The browser never loads the raw OSCAL profile or catalog.
 */
export function createGeneratedFrameworkProvider(
  framework: Framework,
): FrameworkProvider {
  return {
    getFramework(): Framework {
      return framework;
    },
  };
}

export const nistLowFrameworkProvider: FrameworkProvider =
  createGeneratedFrameworkProvider(generatedLow as Framework);

export const nistModerateFrameworkProvider: FrameworkProvider =
  createGeneratedFrameworkProvider(generatedModerate as Framework);

export const nistHighFrameworkProvider: FrameworkProvider =
  createGeneratedFrameworkProvider(generatedHigh as Framework);

export const cmmcLevel2FrameworkProvider: FrameworkProvider =
  createGeneratedFrameworkProvider(generatedCmmcLevel2 as Framework);

/** @deprecated Use createGeneratedFrameworkProvider. */
export const createNistModerateFrameworkProvider =
  createGeneratedFrameworkProvider;
