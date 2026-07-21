import { DEFAULT_CONTROL_IMPLEMENTATION } from "@/data/implementation";
import type { Project } from "@/domain";
import {
  NIST_SP80053_REV5_MODERATE_PROFILE_MEDIA_TYPE,
  NIST_SP80053_REV5_MODERATE_PROFILE_TITLE,
  NIST_SP80053_REV5_MODERATE_PROFILE_URI,
  OSCAL_VERSION,
  SSP_DOCUMENT_VERSION,
} from "./constants";
import { mapImplementationStatusToOscal } from "./mapStatus";
import type { OscalSspDocument } from "./types";

export type ProjectToOscalSspOptions = {
  /** ISO-8601 timestamp for metadata last-modified. Defaults to now. */
  lastModified?: string;
  /** UUID factory. Defaults to crypto.randomUUID. */
  createUuid?: () => string;
};

function defaultCreateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Pure mapping from the internal Project domain model to a minimal OSCAL SSP
 * JSON document. Side-effectful defaults (time/UUID) are injectable.
 *
 * import-profile references the pinned NIST SP 800-53 Rev. 5 Moderate profile
 * via back-matter + commit-pinned upstream URI (see constants / SOURCES.md).
 * A future portable package should embed profile and catalog locally instead.
 */
export function projectToOscalSsp(
  project: Project,
  options: ProjectToOscalSspOptions = {},
): OscalSspDocument {
  const createUuid = options.createUuid ?? defaultCreateUuid;
  const lastModified = options.lastModified ?? new Date().toISOString();

  const systemName =
    project.metadata.systemName.trim() || "Untitled System";
  const systemDescription = project.metadata.systemDescription.trim();
  const organizationName = project.metadata.organizationName.trim();

  const sspUuid = createUuid();
  const systemId = createUuid();
  const thisSystemComponentUuid = createUuid();
  const profileResourceUuid = createUuid();
  const informationTypeUuid = createUuid();

  const parties = organizationName
    ? [
        {
          uuid: createUuid(),
          type: "organization" as const,
          name: organizationName,
        },
      ]
    : undefined;

  const implementedRequirements = project.frameworkControls.map((control) => {
    const implementation =
      project.implementations[control.id] ?? DEFAULT_CONTROL_IMPLEMENTATION;
    const oscalStatus = mapImplementationStatusToOscal(implementation.status);

    return {
      uuid: createUuid(),
      "control-id": control.id,
      "by-components": [
        {
          "component-uuid": thisSystemComponentUuid,
          uuid: createUuid(),
          description: implementation.narrative,
          ...(oscalStatus
            ? { "implementation-status": { state: oscalStatus } }
            : {}),
        },
      ],
    };
  });

  return {
    "system-security-plan": {
      uuid: sspUuid,
      metadata: {
        title: `${systemName} System Security Plan`,
        "last-modified": lastModified,
        version: SSP_DOCUMENT_VERSION,
        "oscal-version": OSCAL_VERSION,
        ...(parties ? { parties } : {}),
      },
      "import-profile": {
        href: `#${profileResourceUuid}`,
      },
      "system-characteristics": {
        "system-ids": [
          {
            "identifier-type": "http://ietf.org/rfc/rfc4122",
            id: systemId,
          },
        ],
        "system-name": systemName,
        description:
          systemDescription ||
          "System description has not been provided.",
        "system-information": {
          "information-types": [
            {
              uuid: informationTypeUuid,
              title: "Unspecified",
              description:
                "Information types are not captured in the current application domain model.",
            },
          ],
        },
        status: {
          state: "under-development",
          remarks:
            "Operational status is not captured in the current application domain model.",
        },
        "authorization-boundary": {
          description:
            systemDescription ||
            "Authorization boundary has not been documented.",
        },
        ...(parties
          ? {
              "responsible-parties": [
                {
                  "role-id": "system-owner",
                  "party-uuids": [parties[0].uuid],
                },
              ],
            }
          : {}),
      },
      "system-implementation": {
        components: [
          {
            uuid: thisSystemComponentUuid,
            type: "this-system",
            title: systemName,
            description:
              systemDescription ||
              "This system as described by this system security plan.",
            status: {
              state: "under-development",
            },
          },
        ],
      },
      "control-implementation": {
        description:
          "Control implementation narratives for the selected NIST Moderate MVP control subset.",
        "implemented-requirements": implementedRequirements,
      },
      "back-matter": {
        resources: [
          {
            uuid: profileResourceUuid,
            title: NIST_SP80053_REV5_MODERATE_PROFILE_TITLE,
            description:
              "Official NIST SP 800-53 Revision 5 Moderate baseline profile (pinned OSCAL content). The application UI currently authors a small MVP subset of this baseline, not the complete profile.",
            rlinks: [
              {
                href: NIST_SP80053_REV5_MODERATE_PROFILE_URI,
                "media-type": NIST_SP80053_REV5_MODERATE_PROFILE_MEDIA_TYPE,
              },
            ],
          },
        ],
      },
    },
  };
}
