/**
 * Provenance-bearing text from a catalog, baseline, or overlay source.
 * `source` is a stable publisher/artifact label, not an effective-value winner.
 */
export type FrameworkProvenanceText = {
  text: string;
  source: string;
};

export type FrameworkParameterSelectHowMany = "one" | "one-or-more";

export type FrameworkParameterSelect = {
  howMany?: FrameworkParameterSelectHowMany;
  choices: readonly string[];
};

export type FrameworkOrganizationDefinedParameter = {
  id: string;
  label: string;
  description: string;
  /** Catalog select constraint when the parameter is a choice rather than free text. */
  select?: FrameworkParameterSelect;
};

/**
 * Authoritative-parameter status for overlay frameworks.
 * Does not compute a winner when sources conflict or a public value is missing.
 */
export type FrameworkAuthoritativeValueStatus =
  | "not-indicated"
  | "may-use-baseline"
  | "satisfied-by-overlay"
  | "authoritative-value-required"
  | "source-conflict";

/**
 * Selection facts for a framework item across catalog / external baseline /
 * overlay layers. Field names are generic so FedRAMP, IL5, and privacy
 * overlays can reuse them; they are not a tailoring engine.
 */
export type FrameworkSelectionProvenance = {
  inCatalogBaseline: boolean;
  inExternalBaseline: boolean;
  inOverlay: boolean;
  overlayMarksLeveragedFromExternalBaseline: boolean | null;
};

export type FrameworkParameterMetadata = {
  organizationDefined: readonly FrameworkOrganizationDefinedParameter[];
  baselineAssignment?: FrameworkProvenanceText | null;
  baselineAdditionalGuidance?: FrameworkProvenanceText | null;
  overlayAssignment?: FrameworkProvenanceText | null;
  policyCrossCheck?: FrameworkProvenanceText | null;
  policyCrossCheckIndicatesAuthoritativeValue?: boolean;
  authoritativeValueStatus?: FrameworkAuthoritativeValueStatus;
  /**
   * Deterministic assignment text when overlay layers do not conflict and a
   * public value exists. Null when WP2 left the value unresolved.
   */
  effectiveAssignmentText?: string | null;
  effectiveAssignmentSource?: string | null;
  conditionality?: string | null;
  interpretationConflict?: boolean;
};

export type FrameworkApplicability = {
  kind: "always" | "conditional";
  /** Opaque condition token such as "cds". Not evaluated at runtime. */
  condition: string | null;
  notes: string;
};

export type FrameworkItemKind = "base" | "enhancement" | "other";

/**
 * Read-only control entry for the application-facing framework.
 * Not a raw OSCAL catalog or profile record.
 * User implementation data must not be stored on this type.
 */
export type FrameworkControl = {
  /** Catalog control identifier, e.g. "ac-1", "ac-2.1", or "AC.L2-3.1.1". */
  id: string;
  title: string;
  family: string;
  /**
   * Control statement text from the official catalog.
   * Nested OSCAL statement parts are normalized to a plain string
   * (see framework derivation docs). Parameter insert tokens are preserved.
   * Overlay assignments and supplements are not merged into this field.
   */
  statement: string;
  /** Baseline or source label, e.g. "NIST SP 800-53 Rev. 5 Moderate". */
  source: string;
  /** Source catalog or baseline version label. */
  sourceVersion: string;
  /**
   * Origin identifier when this item is adopted from another publication.
   * For CMMC Level 2, the NIST SP 800-171 R2 requirement number (e.g. "3.1.1").
   * Not an independent operational row key.
   */
  originId?: string;
  /** Structural kind when the provider distinguishes bases, enhancements, and non-catalog items. */
  itemKind?: FrameworkItemKind;
  selectionProvenance?: FrameworkSelectionProvenance;
  parameters?: FrameworkParameterMetadata;
  supplements?: readonly FrameworkProvenanceText[];
  applicability?: FrameworkApplicability;
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
  /** User-facing item name. Defaults to "control" when omitted. */
  itemSingular?: string;
  /** User-facing item plural. Defaults to "controls" when omitted. */
  itemPlural?: string;
  oscalProfileTitle?: string;
  oscalProfileUri?: string;
  oscalProfileMediaType?: string;
  /**
   * When false, the framework is registered and resolvable but omitted from
   * new-project selectors and create. Omitted or true means product-selectable.
   */
  productSelectable?: boolean;
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
