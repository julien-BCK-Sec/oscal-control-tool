import { isRegisteredFrameworkId } from "@/data/framework";

export const FRAMEWORK_IDENTITY_IMMUTABLE_MESSAGE =
  "Framework identity cannot be changed after project creation.";

export function parseRegisteredFrameworkId(value: string): string {
  const frameworkId = value.trim();
  if (!frameworkId) {
    throw new Error("frameworkId is required.");
  }
  if (!isRegisteredFrameworkId(frameworkId)) {
    throw new Error(`Unknown framework: ${frameworkId}`);
  }
  return frameworkId;
}

export function rejectFrameworkIdentityChange(
  existingFrameworkId: string,
  requestedFrameworkId: string,
): { ok: true; frameworkId: string } | { ok: false; message: string } {
  const requested = requestedFrameworkId.trim();
  if (!requested) {
    return { ok: false, message: "frameworkId is required." };
  }
  if (requested !== existingFrameworkId) {
    return { ok: false, message: FRAMEWORK_IDENTITY_IMMUTABLE_MESSAGE };
  }
  return { ok: true, frameworkId: existingFrameworkId };
}
