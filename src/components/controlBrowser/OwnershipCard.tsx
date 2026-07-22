"use client";

import {
  displayControlOwner,
  isControlOwnerUnassigned,
  type ControlRecordFields,
} from "@/data/control-record";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { Stack } from "@/components/design-system/layout/primitives";

export type OwnershipCardProps = {
  controlId: string;
  fields: ControlRecordFields;
  onChange: (patch: Partial<ControlRecordFields>) => void;
};

export function OwnershipCard({
  controlId,
  fields,
  onChange,
}: OwnershipCardProps) {
  const ownerFieldId = `control-owner-${controlId}`;
  const coOwnerFieldId = `control-co-owner-${controlId}`;
  const businessUnitFieldId = `control-business-unit-${controlId}`;
  const unassigned = isControlOwnerUnassigned(fields.owner);

  return (
    <SidebarCard title="Ownership" titleId="control-ownership-heading">
      <Stack gap="sm">
        <FormField>
          <FormLabel htmlFor={ownerFieldId}>Owner</FormLabel>
          <input
            id={ownerFieldId}
            type="text"
            value={fields.owner}
            onChange={(event) => onChange({ owner: event.target.value })}
            placeholder={displayControlOwner("")}
            className="field mt-1"
            autoComplete="off"
          />
          {unassigned ? (
            <FormHint tone="muted" role="status">
              No owner assigned
            </FormHint>
          ) : null}
        </FormField>

        <FormField>
          <FormLabel htmlFor={coOwnerFieldId}>Co-owner</FormLabel>
          <input
            id={coOwnerFieldId}
            type="text"
            value={fields.coOwner}
            onChange={(event) => onChange({ coOwner: event.target.value })}
            className="field mt-1"
            autoComplete="off"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor={businessUnitFieldId}>Business unit</FormLabel>
          <input
            id={businessUnitFieldId}
            type="text"
            value={fields.businessUnit}
            onChange={(event) => onChange({ businessUnit: event.target.value })}
            className="field mt-1"
            autoComplete="off"
          />
        </FormField>
      </Stack>
    </SidebarCard>
  );
}
