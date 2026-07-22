"use client";

import {
  displayControlOwner,
  isControlOwnerUnassigned,
  type ControlRecordFields,
} from "@/data/control-record";
import { SidebarCard } from "@/components/controlBrowser/SidebarCard";

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
      <div className="space-y-3">
        <div>
          <label htmlFor={ownerFieldId} className="label">
            Owner
          </label>
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
            <p className="mt-1 text-xs text-warning" role="status">
              No owner assigned
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={coOwnerFieldId} className="label">
            Co-owner
          </label>
          <input
            id={coOwnerFieldId}
            type="text"
            value={fields.coOwner}
            onChange={(event) => onChange({ coOwner: event.target.value })}
            className="field mt-1"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={businessUnitFieldId} className="label">
            Business Unit
          </label>
          <input
            id={businessUnitFieldId}
            type="text"
            value={fields.businessUnit}
            onChange={(event) => onChange({ businessUnit: event.target.value })}
            className="field mt-1"
            autoComplete="off"
          />
        </div>
      </div>
    </SidebarCard>
  );
}
