/**
 * User-entered implementation status for a control.
 * Stored separately from authoritative framework control data.
 */
export type ImplementationStatus =
  | "not-started"
  | "in-progress"
  | "implemented"
  | "not-applicable";

/**
 * User-entered implementation content for a single control.
 * Must not be mixed into FrameworkControl.
 */
export type ControlImplementation = {
  status: ImplementationStatus;
  narrative: string;
};
