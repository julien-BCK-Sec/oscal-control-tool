/**
 * Read-only control entry for the application-facing framework.
 * Not a raw OSCAL catalog or profile record.
 * User implementation data must not be stored on this type.
 */
export type FrameworkControl = {
  /** Catalog control identifier, e.g. "ac-1" or "ac-2.1". */
  id: string;
  title: string;
  family: string;
  /**
   * Control statement text from the official catalog.
   * Nested OSCAL statement parts are normalized to a plain string
   * (see framework derivation docs). Parameter insert tokens are preserved.
   */
  statement: string;
  /** Baseline or source label, e.g. "NIST SP 800-53 Rev. 5 Moderate". */
  source: string;
  /** Source catalog or baseline version label. */
  sourceVersion: string;
};

/**
 * Application-facing framework (control set) independent of OSCAL types.
 */
export type Framework = {
  /** Stable application id, e.g. "nist-sp-800-53-rev5-moderate". */
  id: string;
  title: string;
  source: string;
  sourceVersion: string;
  controls: readonly FrameworkControl[];
};

/**
 * Supplies the read-only framework the UI and domain consume.
 * Implementations must return application types, not raw OSCAL.
 */
export interface FrameworkProvider {
  getFramework(): Framework;
}

/**
 * Registry metadata for a supported framework/profile.
 * Durable identity is `id`; remaining fields are display/export metadata.
 * OSCAL fields are present for NIST OSCAL-backed entries and omitted for
 * future non-OSCAL providers.
 */
export type FrameworkDescriptor = {
  id: string;
  title: string;
  catalog: string;
  revision: string;
  profile: string;
  provider: string;
  source: string;
  oscalProfileTitle?: string;
  oscalProfileUri?: string;
  oscalProfileMediaType?: string;
};

/**
 * In-process catalog of supported FrameworkProviders.
 * Not a plugin system. Unknown IDs fail closed.
 */
export interface FrameworkRegistry {
  list(): readonly FrameworkDescriptor[];
  get(id: string): FrameworkProvider | undefined;
  require(id: string): FrameworkProvider;
  getDescriptor(id: string): FrameworkDescriptor | undefined;
  requireDescriptor(id: string): FrameworkDescriptor;
  has(id: string): boolean;
}
