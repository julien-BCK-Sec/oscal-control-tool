"use client";

import {
  EVIDENCE_REQUIREMENTS,
  evidenceRequirementLabel,
  type EvidenceRequirement,
  CONTROL_IMPLEMENTATION_STATUSES,
  controlImplementationStatusLabel,
  type ControlRecordFields,
  type ControlImplementationStatus,
} from "@/data/control-record";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";
import {
  FormField,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";

export type ImplementationMetaCardProps = {
  controlId: string;
  fields: ControlRecordFields;
  onChange: (patch: Partial<ControlRecordFields>) => void;
};

export function ImplementationMetaCard({
  controlId,
  fields,
  onChange,
}: ImplementationMetaCardProps) {
  const implementationStatusFieldId = `control-implementation-status-${controlId}`;
  const reviewDueFieldId = `control-review-due-${controlId}`;
  const evidenceRequirementFieldId = `control-evidence-requirement-${controlId}`;

  return (
    <SidebarCard
      title="Implementation"
      titleId="control-implementation-meta-heading"
    >
      <Stack gap="sm">
        <FormField>
          <FormLabel htmlFor={implementationStatusFieldId}>
            Implementation status
          </FormLabel>
          <select
            id={implementationStatusFieldId}
            value={fields.implementationStatus}
            onChange={(event) =>
              onChange({
                implementationStatus: event.target
                  .value as ControlImplementationStatus,
              })
            }
            className="field mt-1"
          >
            {CONTROL_IMPLEMENTATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {controlImplementationStatusLabel(status)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField>
          <FormLabel htmlFor={reviewDueFieldId}>Review due date</FormLabel>
          <input
            id={reviewDueFieldId}
            type="date"
            value={fields.reviewDueDate ?? ""}
            onChange={(event) =>
              onChange({
                reviewDueDate:
                  event.target.value.trim() === "" ? null : event.target.value,
              })
            }
            className="field mt-1"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor={evidenceRequirementFieldId}>
            Evidence requirement
          </FormLabel>
          <select
            id={evidenceRequirementFieldId}
            value={fields.evidenceRequirement}
            onChange={(event) =>
              onChange({
                evidenceRequirement: event.target.value as EvidenceRequirement,
              })
            }
            className="field mt-1"
          >
            {EVIDENCE_REQUIREMENTS.map((requirement) => (
              <option key={requirement} value={requirement}>
                {evidenceRequirementLabel(requirement)}
              </option>
            ))}
          </select>
        </FormField>
      </Stack>
    </SidebarCard>
  );
}
