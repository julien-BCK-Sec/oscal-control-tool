import {
  CONTROL_IMPLEMENTATION_STATUSES,
  controlImplementationStatusLabel,
  displayControlOwner,
  isControlOwnerUnassigned,
  type ControlRecordFields,
  type ControlImplementationStatus,
} from "@/data/control-record";

export type ControlMetadataSectionProps = {
  controlId: string;
  fields: ControlRecordFields;
  onChange: (patch: Partial<ControlRecordFields>) => void;
};

export function ControlMetadataSection({
  controlId,
  fields,
  onChange,
}: ControlMetadataSectionProps) {
  const ownerFieldId = `control-owner-${controlId}`;
  const coOwnerFieldId = `control-co-owner-${controlId}`;
  const businessUnitFieldId = `control-business-unit-${controlId}`;
  const implementationStatusFieldId = `control-implementation-status-${controlId}`;
  const reviewDueFieldId = `control-review-due-${controlId}`;
  const unassigned = isControlOwnerUnassigned(fields.owner);

  return (
    <section className="max-w-3xl" aria-labelledby="control-metadata-heading">
      <h3
        id="control-metadata-heading"
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        Control Metadata
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        Application ownership and lifecycle — not part of the OSCAL control
        document.
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
            className="field mt-1.5"
            autoComplete="off"
          />
          {unassigned ? (
            <p className="mt-1.5 text-xs text-warning" role="status">
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
            className="field mt-1.5"
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
            className="field mt-1.5"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={implementationStatusFieldId} className="label">
            Implementation Status
          </label>
          <select
            id={implementationStatusFieldId}
            value={fields.implementationStatus}
            onChange={(event) =>
              onChange({
                implementationStatus: event.target
                  .value as ControlImplementationStatus,
              })
            }
            className="field mt-1.5"
          >
            {CONTROL_IMPLEMENTATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {controlImplementationStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 sm:max-w-xs">
          <label htmlFor={reviewDueFieldId} className="label">
            Review Due Date
          </label>
          <input
            id={reviewDueFieldId}
            type="date"
            value={fields.reviewDueDate ?? ""}
            onChange={(event) =>
              onChange({
                reviewDueDate:
                  event.target.value.trim() === ""
                    ? null
                    : event.target.value,
              })
            }
            className="field mt-1.5"
          />
        </div>
      </div>
    </section>
  );
}
