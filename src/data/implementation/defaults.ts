import type { ControlImplementation } from "./types";

/** Default implementation values for a control that has not been edited yet. */
export const DEFAULT_CONTROL_IMPLEMENTATION: ControlImplementation = {
  status: "not-started",
  narrative: "",
};
