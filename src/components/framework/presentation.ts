import type { FrameworkDescriptor } from "@/data/framework/types";

/**
 * Human-readable project framework label from registry metadata.
 * Presentation only — do not persist this string.
 */
export function formatFrameworkLabel(
  descriptor: Pick<FrameworkDescriptor, "catalog" | "revision" | "profile">,
): string {
  const catalog = descriptor.catalog.trim();
  const revision = descriptor.revision.trim();
  const profile = descriptor.profile.trim();
  if (catalog && revision && profile) {
    return `${catalog} ${revision} — ${profile}`;
  }
  return [catalog, revision, profile].filter(Boolean).join(" ");
}

export function formatFrameworkProfile(
  descriptor: Pick<FrameworkDescriptor, "profile">,
): string {
  return descriptor.profile.trim();
}

export function findFrameworkDescriptor(
  frameworks: readonly FrameworkDescriptor[],
  frameworkId: string,
): FrameworkDescriptor | undefined {
  const id = frameworkId.trim();
  return frameworks.find((entry) => entry.id === id);
}
