import type { ImplementationStatus } from "@/data/implementation";

export const IMPLEMENTATION_DOCUMENTATION_STATUS_LABELS: Record<
  ImplementationStatus,
  string
> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  implemented: "Implemented",
  "not-applicable": "Not applicable",
};

export function implementationDocumentationStatusLabel(
  status: ImplementationStatus,
): string {
  return IMPLEMENTATION_DOCUMENTATION_STATUS_LABELS[status];
}
