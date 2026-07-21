/**
 * Read-only framework control from an authoritative catalog source.
 * User implementation data must not be stored on this type.
 */
export type FrameworkControl = {
  /** Catalog control identifier, e.g. "ac-1". */
  id: string;
  title: string;
  family: string;
  /**
   * Control statement text.
   * When marked as a placeholder, this is not official FedRAMP/NIST content.
   */
  statement: string;
  /** Catalog or baseline name, e.g. "FedRAMP Moderate". */
  source: string;
  /** Source catalog or baseline version label. */
  sourceVersion: string;
};
