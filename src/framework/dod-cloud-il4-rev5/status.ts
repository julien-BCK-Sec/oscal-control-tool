import type { FrameworkAuthoritativeValueStatus } from "@/data/framework/types";
import type { DspavStatus } from "./types";

export function mapIl4DspavStatus(
  status: DspavStatus,
): FrameworkAuthoritativeValueStatus {
  if (status === "fedramp-explicitly-referenced") {
    return "may-use-baseline";
  }
  if (status === "satisfied-by-addendum-value") {
    return "satisfied-by-overlay";
  }
  if (status === "fedramp-base-inherited") {
    return "baseline-inherited";
  }
  if (status === "dod-explicit") {
    return "overlay-explicit";
  }
  return status;
}
