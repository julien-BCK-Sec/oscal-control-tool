"use client";

import { ExportOscalButton } from "@/components/ExportOscalButton";
import {
  AUTHORIZATION_BOUNDARY_HINT,
  CATEGORIZATION_HINT,
  DOD_CLOUD_IMPACT_LABELS,
  DOD_IMPACT_HINT,
  documentedAgainstCopy,
  ENVIRONMENT_HINT,
  FIPS_IMPACT_LABELS,
  INTERCONNECTION_DIRECTION_LABELS,
  INTERCONNECTIONS_HINT,
  OPERATIONAL_STATUS_HINT,
  OPERATIONAL_STATUS_LABELS,
  PROJECT_DETAILS_INTRO,
  SSP_ORGANIZATION_HINT,
  SYSTEM_OVERVIEW_HINT,
  SYSTEM_ROLE_LABELS,
  SYSTEM_ROLES_HINT,
} from "@/components/projectDetails/copy";
import {
  createEmptyInformationType,
  createEmptyInterconnection,
  createEmptySystemRole,
} from "@/components/projectDetails/rows";
import { HelpLink } from "@/components/help/HelpLink";
import {
  FormField,
  FormHint,
  FormLabel,
} from "@/components/design-system/form/FormField";
import { SectionHeader } from "@/components/design-system/layout/primitives";
import type { Framework } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import {
  DOD_CLOUD_IMPACT_LEVELS,
  FIPS_IMPACT_LEVELS,
  INTERCONNECTION_DIRECTIONS,
  SYSTEM_OPERATIONAL_STATUSES,
  SYSTEM_ROLE_TYPES,
  type DodCloudImpactLevel,
  type FipsImpactLevel,
  type InformationType,
  type InterconnectionDirection,
  type ProjectMetadata,
  type SecurityCategorization,
  type SystemInterconnection,
  type SystemOperationalStatus,
  type SystemRole,
  type SystemRoleType,
} from "@/data/project";
import { frameworkHasOscalSspExport } from "@/framework/nist-sp-800-53-rev5/identities";

export type ProjectMetadataSectionProps = {
  framework: Framework;
  metadata: ProjectMetadata;
  onMetadataChange: (next: ProjectMetadata) => void;
  implementations: Record<string, ControlImplementation>;
  projectName?: string;
};

function newRowId(): string {
  return crypto.randomUUID();
}

function isFipsImpactLevel(value: string): value is FipsImpactLevel {
  return (FIPS_IMPACT_LEVELS as readonly string[]).includes(value);
}

function isSystemRoleType(value: string): value is SystemRoleType {
  return (SYSTEM_ROLE_TYPES as readonly string[]).includes(value);
}

function isOperationalStatus(value: string): value is SystemOperationalStatus {
  return (SYSTEM_OPERATIONAL_STATUSES as readonly string[]).includes(value);
}

function isInterconnectionDirection(
  value: string,
): value is InterconnectionDirection {
  return (INTERCONNECTION_DIRECTIONS as readonly string[]).includes(value);
}

function isDodCloudImpactLevel(value: string): value is DodCloudImpactLevel {
  return (DOD_CLOUD_IMPACT_LEVELS as readonly string[]).includes(value);
}

function categorizationOrNull(
  value: SecurityCategorization,
): SecurityCategorization | null {
  if (
    !value.confidentiality &&
    !value.integrity &&
    !value.availability &&
    !value.rationale?.trim()
  ) {
    return null;
  }
  return value;
}

export function ProjectMetadataSection({
  framework,
  metadata,
  onMetadataChange,
  implementations,
  projectName,
}: ProjectMetadataSectionProps) {
  const oscalAvailable = frameworkHasOscalSspExport(framework.id);
  const frameworkLabel = framework.title;

  function updateMetadata(patch: Partial<ProjectMetadata>) {
    onMetadataChange({
      ...metadata,
      ...patch,
    });
  }

  function updateCategorization(patch: Partial<SecurityCategorization>) {
    const current = metadata.securityCategorization ?? {};
    updateMetadata({
      securityCategorization: categorizationOrNull({
        ...current,
        ...patch,
      }),
    });
  }

  function updateRole(id: string, patch: Partial<SystemRole>) {
    updateMetadata({
      systemRoles: metadata.systemRoles.map((role) =>
        role.id === id ? { ...role, ...patch } : role,
      ),
    });
  }

  function updateInformationType(id: string, patch: Partial<InformationType>) {
    updateMetadata({
      informationTypes: metadata.informationTypes.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function updateInterconnection(
    id: string,
    patch: Partial<SystemInterconnection>,
  ) {
    updateMetadata({
      interconnections: metadata.interconnections.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <section aria-labelledby="project-metadata-heading" className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="project-metadata-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Project details
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {projectName ? `Editing “${projectName}”. ` : null}
            {PROJECT_DETAILS_INTRO}{" "}
            <HelpLink slug="projects" hash="system-characteristics">
              Learn more
            </HelpLink>
          </p>
        </div>
        <ExportOscalButton
          framework={framework}
          metadata={metadata}
          implementations={implementations}
        />
      </div>

      <section aria-labelledby="system-identity-heading" className="space-y-4">
        <SectionHeader
          titleId="system-identity-heading"
          title="System identity"
          description={
            oscalAvailable
              ? "Name and overview used in documentation and NIST OSCAL export."
              : "Name and overview used in this documentation project."
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField>
            <FormLabel htmlFor="project-system-name">System name</FormLabel>
            <input
              id="project-system-name"
              type="text"
              value={metadata.systemName}
              onChange={(event) =>
                updateMetadata({ systemName: event.target.value })
              }
              className="field mt-1.5"
              autoComplete="off"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="project-system-name-short">
              Short name
            </FormLabel>
            <input
              id="project-system-name-short"
              type="text"
              value={metadata.systemNameShort}
              onChange={(event) =>
                updateMetadata({ systemNameShort: event.target.value })
              }
              className="field mt-1.5"
              autoComplete="off"
            />
          </FormField>
          <FormField className="sm:col-span-2">
            <FormLabel htmlFor="project-system-identifier">
              System identifier
            </FormLabel>
            <input
              id="project-system-identifier"
              type="text"
              value={metadata.systemIdentifier}
              onChange={(event) =>
                updateMetadata({ systemIdentifier: event.target.value })
              }
              className="field mt-1.5"
              autoComplete="off"
            />
          </FormField>
          <FormField className="sm:col-span-2">
            <FormLabel htmlFor="project-system-description">
              System overview
            </FormLabel>
            <textarea
              id="project-system-description"
              value={metadata.systemDescription}
              onChange={(event) =>
                updateMetadata({ systemDescription: event.target.value })
              }
              rows={6}
              className="field mt-1.5 resize-y leading-relaxed"
            />
            <FormHint>{SYSTEM_OVERVIEW_HINT}</FormHint>
          </FormField>
        </div>
      </section>

      <section aria-labelledby="ssp-organization-heading" className="space-y-4">
        <SectionHeader
          titleId="ssp-organization-heading"
          title="SSP organization"
          description={SSP_ORGANIZATION_HINT}
        />
        <FormField>
          <FormLabel htmlFor="project-organization-name">
            Organization name
          </FormLabel>
          <input
            id="project-organization-name"
            type="text"
            value={metadata.organizationName}
            onChange={(event) =>
              updateMetadata({ organizationName: event.target.value })
            }
            className="field mt-1.5"
            autoComplete="organization"
          />
        </FormField>
      </section>

      <section
        aria-labelledby="boundary-environment-heading"
        className="space-y-4"
      >
        <SectionHeader
          titleId="boundary-environment-heading"
          title="Boundary and environment"
        />
        <FormField>
          <FormLabel htmlFor="project-authorization-boundary">
            Authorization boundary
          </FormLabel>
          <textarea
            id="project-authorization-boundary"
            value={metadata.authorizationBoundary}
            onChange={(event) =>
              updateMetadata({ authorizationBoundary: event.target.value })
            }
            rows={5}
            className="field mt-1.5 resize-y leading-relaxed"
          />
          <FormHint>{AUTHORIZATION_BOUNDARY_HINT}</FormHint>
        </FormField>
        <FormField>
          <FormLabel htmlFor="project-environment">
            Environment of operation
          </FormLabel>
          <textarea
            id="project-environment"
            value={metadata.environmentOfOperation}
            onChange={(event) =>
              updateMetadata({ environmentOfOperation: event.target.value })
            }
            rows={5}
            className="field mt-1.5 resize-y leading-relaxed"
          />
          <FormHint>{ENVIRONMENT_HINT}</FormHint>
        </FormField>
      </section>

      <section aria-labelledby="system-roles-heading" className="space-y-4">
        <SectionHeader
          titleId="system-roles-heading"
          title="System roles"
          description={SYSTEM_ROLES_HINT}
        />
        {metadata.systemRoles.length === 0 ? (
          <p className="text-xs text-text-muted">No SSP roles documented.</p>
        ) : (
          <ul className="space-y-4">
            {metadata.systemRoles.map((role, index) => (
              <li
                key={role.id}
                className="space-y-3 rounded-sm border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Role {index + 1}
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      updateMetadata({
                        systemRoles: metadata.systemRoles.filter(
                          (entry) => entry.id !== role.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField>
                    <FormLabel htmlFor={`role-type-${role.id}`}>Role</FormLabel>
                    <select
                      id={`role-type-${role.id}`}
                      value={role.role}
                      onChange={(event) => {
                        const nextRole = event.target.value;
                        if (!isSystemRoleType(nextRole)) {
                          return;
                        }
                        updateRole(role.id, {
                          role: nextRole,
                          otherRoleLabel:
                            nextRole === "other"
                              ? role.otherRoleLabel ?? ""
                              : undefined,
                        });
                      }}
                      className="field mt-1.5"
                    >
                      {SYSTEM_ROLE_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {SYSTEM_ROLE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  {role.role === "other" ? (
                    <FormField>
                      <FormLabel htmlFor={`role-other-${role.id}`}>
                        Other role label
                      </FormLabel>
                      <input
                        id={`role-other-${role.id}`}
                        type="text"
                        value={role.otherRoleLabel ?? ""}
                        onChange={(event) =>
                          updateRole(role.id, {
                            otherRoleLabel: event.target.value,
                          })
                        }
                        className="field mt-1.5"
                      />
                    </FormField>
                  ) : null}
                  <FormField>
                    <FormLabel htmlFor={`role-name-${role.id}`}>Name</FormLabel>
                    <input
                      id={`role-name-${role.id}`}
                      type="text"
                      value={role.name}
                      onChange={(event) =>
                        updateRole(role.id, { name: event.target.value })
                      }
                      className="field mt-1.5"
                      autoComplete="name"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`role-title-${role.id}`}>
                      Title
                    </FormLabel>
                    <input
                      id={`role-title-${role.id}`}
                      type="text"
                      value={role.title ?? ""}
                      onChange={(event) =>
                        updateRole(role.id, { title: event.target.value })
                      }
                      className="field mt-1.5"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`role-org-${role.id}`}>
                      Organization
                    </FormLabel>
                    <input
                      id={`role-org-${role.id}`}
                      type="text"
                      value={role.organization ?? ""}
                      onChange={(event) =>
                        updateRole(role.id, {
                          organization: event.target.value,
                        })
                      }
                      className="field mt-1.5"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`role-email-${role.id}`}>
                      Email
                    </FormLabel>
                    <input
                      id={`role-email-${role.id}`}
                      type="email"
                      value={role.email ?? ""}
                      onChange={(event) =>
                        updateRole(role.id, { email: event.target.value })
                      }
                      className="field mt-1.5"
                      autoComplete="email"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`role-phone-${role.id}`}>
                      Phone
                    </FormLabel>
                    <input
                      id={`role-phone-${role.id}`}
                      type="tel"
                      value={role.phone ?? ""}
                      onChange={(event) =>
                        updateRole(role.id, { phone: event.target.value })
                      }
                      className="field mt-1.5"
                      autoComplete="tel"
                    />
                  </FormField>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() =>
            updateMetadata({
              systemRoles: [
                ...metadata.systemRoles,
                createEmptySystemRole(newRowId()),
              ],
            })
          }
        >
          Add role
        </button>
      </section>

      <section aria-labelledby="categorization-heading" className="space-y-4">
        <SectionHeader
          titleId="categorization-heading"
          title="Information types and categorization"
          description={documentedAgainstCopy(frameworkLabel)}
        />
        <FormHint>{CATEGORIZATION_HINT}</FormHint>
        <div className="grid gap-3 sm:grid-cols-3">
          <FipsSelect
            id="categorization-confidentiality"
            label="Confidentiality"
            value={metadata.securityCategorization?.confidentiality ?? ""}
            onChange={(confidentiality) =>
              updateCategorization({
                confidentiality: confidentiality || undefined,
              })
            }
          />
          <FipsSelect
            id="categorization-integrity"
            label="Integrity"
            value={metadata.securityCategorization?.integrity ?? ""}
            onChange={(integrity) =>
              updateCategorization({ integrity: integrity || undefined })
            }
          />
          <FipsSelect
            id="categorization-availability"
            label="Availability"
            value={metadata.securityCategorization?.availability ?? ""}
            onChange={(availability) =>
              updateCategorization({
                availability: availability || undefined,
              })
            }
          />
        </div>
        <FormField>
          <FormLabel htmlFor="categorization-rationale">
            Categorization rationale
          </FormLabel>
          <textarea
            id="categorization-rationale"
            value={metadata.securityCategorization?.rationale ?? ""}
            onChange={(event) =>
              updateCategorization({ rationale: event.target.value })
            }
            rows={3}
            className="field mt-1.5 resize-y leading-relaxed"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="dod-impact-level">
            DoD cloud impact level
          </FormLabel>
          <select
            id="dod-impact-level"
            value={metadata.dodCloudImpactLevel?.level ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") {
                updateMetadata({ dodCloudImpactLevel: null });
                return;
              }
              if (!isDodCloudImpactLevel(value)) {
                return;
              }
              updateMetadata({
                dodCloudImpactLevel: {
                  level: value,
                  notes: metadata.dodCloudImpactLevel?.notes,
                },
              });
            }}
            className="field mt-1.5"
          >
            <option value="">Not documented</option>
            {DOD_CLOUD_IMPACT_LEVELS.map((value) => (
              <option key={value} value={value}>
                {DOD_CLOUD_IMPACT_LABELS[value]}
              </option>
            ))}
          </select>
          <FormHint>{DOD_IMPACT_HINT}</FormHint>
        </FormField>
        {metadata.dodCloudImpactLevel ? (
          <FormField>
            <FormLabel htmlFor="dod-impact-notes">
              DoD impact-level notes
            </FormLabel>
            <textarea
              id="dod-impact-notes"
              value={metadata.dodCloudImpactLevel.notes ?? ""}
              onChange={(event) =>
                updateMetadata({
                  dodCloudImpactLevel: {
                    level: metadata.dodCloudImpactLevel!.level,
                    notes: event.target.value,
                  },
                })
              }
              rows={2}
              className="field mt-1.5 resize-y leading-relaxed"
            />
          </FormField>
        ) : null}

        {metadata.informationTypes.length === 0 ? (
          <p className="text-xs text-text-muted">
            No information types documented.
          </p>
        ) : (
          <ul className="space-y-4">
            {metadata.informationTypes.map((item, index) => (
              <li
                key={item.id}
                className="space-y-3 rounded-sm border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Information type {index + 1}
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      updateMetadata({
                        informationTypes: metadata.informationTypes.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
                <FormField>
                  <FormLabel htmlFor={`info-title-${item.id}`}>Title</FormLabel>
                  <input
                    id={`info-title-${item.id}`}
                    type="text"
                    value={item.title}
                    onChange={(event) =>
                      updateInformationType(item.id, {
                        title: event.target.value,
                      })
                    }
                    className="field mt-1.5"
                  />
                </FormField>
                <FormField>
                  <FormLabel htmlFor={`info-description-${item.id}`}>
                    Description
                  </FormLabel>
                  <textarea
                    id={`info-description-${item.id}`}
                    value={item.description ?? ""}
                    onChange={(event) =>
                      updateInformationType(item.id, {
                        description: event.target.value,
                      })
                    }
                    rows={2}
                    className="field mt-1.5 resize-y leading-relaxed"
                  />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FipsSelect
                    id={`info-c-${item.id}`}
                    label="Confidentiality"
                    value={item.confidentialityImpact ?? ""}
                    onChange={(confidentialityImpact) =>
                      updateInformationType(item.id, {
                        confidentialityImpact:
                          confidentialityImpact || undefined,
                      })
                    }
                  />
                  <FipsSelect
                    id={`info-i-${item.id}`}
                    label="Integrity"
                    value={item.integrityImpact ?? ""}
                    onChange={(integrityImpact) =>
                      updateInformationType(item.id, {
                        integrityImpact: integrityImpact || undefined,
                      })
                    }
                  />
                  <FipsSelect
                    id={`info-a-${item.id}`}
                    label="Availability"
                    value={item.availabilityImpact ?? ""}
                    onChange={(availabilityImpact) =>
                      updateInformationType(item.id, {
                        availabilityImpact: availabilityImpact || undefined,
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() =>
            updateMetadata({
              informationTypes: [
                ...metadata.informationTypes,
                createEmptyInformationType(newRowId()),
              ],
            })
          }
        >
          Add information type
        </button>
      </section>

      <section aria-labelledby="interconnections-heading" className="space-y-4">
        <SectionHeader
          titleId="interconnections-heading"
          title="Interconnections"
          description={INTERCONNECTIONS_HINT}
        />
        {metadata.interconnections.length === 0 ? (
          <p className="text-xs text-text-muted">
            No interconnections documented.
          </p>
        ) : (
          <ul className="space-y-4">
            {metadata.interconnections.map((item, index) => (
              <li
                key={item.id}
                className="space-y-3 rounded-sm border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Interconnection {index + 1}
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      updateMetadata({
                        interconnections: metadata.interconnections.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField>
                    <FormLabel htmlFor={`conn-name-${item.id}`}>Name</FormLabel>
                    <input
                      id={`conn-name-${item.id}`}
                      type="text"
                      value={item.name}
                      onChange={(event) =>
                        updateInterconnection(item.id, {
                          name: event.target.value,
                        })
                      }
                      className="field mt-1.5"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`conn-org-${item.id}`}>
                      External organization
                    </FormLabel>
                    <input
                      id={`conn-org-${item.id}`}
                      type="text"
                      value={item.organization ?? ""}
                      onChange={(event) =>
                        updateInterconnection(item.id, {
                          organization: event.target.value,
                        })
                      }
                      className="field mt-1.5"
                    />
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`conn-direction-${item.id}`}>
                      Direction
                    </FormLabel>
                    <select
                      id={`conn-direction-${item.id}`}
                      value={item.direction ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "") {
                          updateInterconnection(item.id, {
                            direction: undefined,
                          });
                          return;
                        }
                        if (!isInterconnectionDirection(value)) {
                          return;
                        }
                        updateInterconnection(item.id, { direction: value });
                      }}
                      className="field mt-1.5"
                    >
                      <option value="">Not documented</option>
                      {INTERCONNECTION_DIRECTIONS.map((value) => (
                        <option key={value} value={value}>
                          {INTERCONNECTION_DIRECTION_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField>
                    <FormLabel htmlFor={`conn-info-${item.id}`}>
                      Information exchanged
                    </FormLabel>
                    <input
                      id={`conn-info-${item.id}`}
                      type="text"
                      value={item.informationExchanged ?? ""}
                      onChange={(event) =>
                        updateInterconnection(item.id, {
                          informationExchanged: event.target.value,
                        })
                      }
                      className="field mt-1.5"
                    />
                  </FormField>
                  <FormField className="sm:col-span-2">
                    <FormLabel htmlFor={`conn-description-${item.id}`}>
                      Description
                    </FormLabel>
                    <textarea
                      id={`conn-description-${item.id}`}
                      value={item.description ?? ""}
                      onChange={(event) =>
                        updateInterconnection(item.id, {
                          description: event.target.value,
                        })
                      }
                      rows={2}
                      className="field mt-1.5 resize-y leading-relaxed"
                    />
                  </FormField>
                  <FormField className="sm:col-span-2">
                    <FormLabel htmlFor={`conn-notes-${item.id}`}>
                      Security notes
                    </FormLabel>
                    <textarea
                      id={`conn-notes-${item.id}`}
                      value={item.securityNotes ?? ""}
                      onChange={(event) =>
                        updateInterconnection(item.id, {
                          securityNotes: event.target.value,
                        })
                      }
                      rows={2}
                      className="field mt-1.5 resize-y leading-relaxed"
                    />
                  </FormField>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() =>
            updateMetadata({
              interconnections: [
                ...metadata.interconnections,
                createEmptyInterconnection(newRowId()),
              ],
            })
          }
        >
          Add interconnection
        </button>
      </section>

      <section aria-labelledby="operational-status-heading" className="space-y-4">
        <SectionHeader
          titleId="operational-status-heading"
          title="Operational status"
          description={OPERATIONAL_STATUS_HINT}
        />
        <FormField>
          <FormLabel htmlFor="project-operational-status">Status</FormLabel>
          <select
            id="project-operational-status"
            value={metadata.operationalStatus}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") {
                updateMetadata({ operationalStatus: "" });
                return;
              }
              if (!isOperationalStatus(value)) {
                return;
              }
              updateMetadata({ operationalStatus: value });
            }}
            className="field mt-1.5"
          >
            <option value="">Not documented</option>
            {SYSTEM_OPERATIONAL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {OPERATIONAL_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField>
          <FormLabel htmlFor="project-operational-status-remarks">
            Status remarks
          </FormLabel>
          <textarea
            id="project-operational-status-remarks"
            value={metadata.operationalStatusRemarks}
            onChange={(event) =>
              updateMetadata({ operationalStatusRemarks: event.target.value })
            }
            rows={2}
            className="field mt-1.5 resize-y leading-relaxed"
          />
        </FormField>
      </section>
    </section>
  );
}

function FipsSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: FipsImpactLevel | "") => void;
}) {
  return (
    <FormField>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "") {
            onChange("");
            return;
          }
          if (!isFipsImpactLevel(next)) {
            return;
          }
          onChange(next);
        }}
        className="field mt-1.5"
      >
        <option value="">Not documented</option>
        {FIPS_IMPACT_LEVELS.map((level) => (
          <option key={level} value={level}>
            {FIPS_IMPACT_LABELS[level]}
          </option>
        ))}
      </select>
    </FormField>
  );
}
