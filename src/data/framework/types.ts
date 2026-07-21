/**
 * Read-only control entry for the application-facing MVP subset.
 * Not a full OSCAL catalog or profile record.
 * User implementation data must not be stored on this type.
 */
export type FrameworkControl = {
  /** Catalog control identifier, e.g. "ac-1". */
  id: string;
  title: string;
  family: string;
  /**
   * Control statement text.
   * When marked as a placeholder, this is not official NIST catalog content.
   */
  statement: string;
  /** Baseline or source label, e.g. "NIST SP 800-53 Rev. 5 Moderate". */
  source: string;
  /** Source catalog or baseline version label. */
  sourceVersion: string;
};
