/**
 * Compatibility re-exports for the former Moderate-only derivation module.
 * Canonical implementation: `src/framework/nist-sp-800-53-rev5/`.
 */

export {
  NIST_MODERATE_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_SOURCE,
  NIST_MODERATE_FRAMEWORK_TITLE,
} from "@/framework/nist-sp-800-53-rev5/identities";
export {
  deriveNistModerateFramework,
  deriveNistSp80053Rev5Framework,
  normalizeStatementText,
  SUPPORTED_NIST_MODERATE_PROFILE_FEATURES,
  SUPPORTED_NIST_SP80053_REV5_PROFILE_FEATURES,
  UNSUPPORTED_PROFILE_FEATURES_THAT_ALTER_FRAMEWORK,
  type FrameworkDerivationFailure,
  type FrameworkDerivationResult,
  type FrameworkDerivationSuccess,
} from "@/framework/nist-sp-800-53-rev5/derive";
