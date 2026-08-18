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

/** Group heading for the project-create selector, e.g. "NIST SP 800-53 Rev. 5". */
export function formatFrameworkFamilyGroup(
  descriptor: Pick<FrameworkDescriptor, "catalog" | "revision">,
): string {
  const catalog = descriptor.catalog.trim();
  const revision = descriptor.revision.trim();
  return [catalog, revision].filter(Boolean).join(" ");
}

export type FrameworkDescriptorGroup = {
  label: string;
  descriptors: FrameworkDescriptor[];
};

export function groupFrameworkDescriptors(
  frameworks: readonly FrameworkDescriptor[],
): FrameworkDescriptorGroup[] {
  const groups: FrameworkDescriptorGroup[] = [];
  const indexByLabel = new Map<string, number>();
  for (const descriptor of frameworks) {
    const label = formatFrameworkFamilyGroup(descriptor) || descriptor.id;
    const existing = indexByLabel.get(label);
    if (existing === undefined) {
      indexByLabel.set(label, groups.length);
      groups.push({ label, descriptors: [descriptor] });
    } else {
      groups[existing].descriptors.push(descriptor);
    }
  }
  return groups;
}

export function findFrameworkDescriptor(
  frameworks: readonly FrameworkDescriptor[],
  frameworkId: string,
): FrameworkDescriptor | undefined {
  const id = frameworkId.trim();
  return frameworks.find((entry) => entry.id === id);
}

export type FrameworkItemTerms = {
  singular: string;
  plural: string;
};

export function frameworkItemTerms(
  descriptor?: Pick<FrameworkDescriptor, "itemSingular" | "itemPlural"> | null,
): FrameworkItemTerms {
  const singular = descriptor?.itemSingular?.trim() || "control";
  const plural = descriptor?.itemPlural?.trim() || "controls";
  return { singular, plural };
}

export function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

export function evidenceCoverageDisclaimer(terms: FrameworkItemTerms): string {
  const item = terms.singular;
  const base = `Evidence coverage is not a compliance score. Counts describe linked active Evidence against each ${item}'s Evidence requirement.`;
  if (item === "requirement") {
    return `${base} Evidence coverage is not a CMMC assessment result, MET / NOT MET determination, SPRS score, or certification status.`;
  }
  return base;
}
