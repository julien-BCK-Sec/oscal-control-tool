import type { ProjectMetadata, SystemRole, SystemRoleType } from "@/data/project";
import type {
  OscalComponent,
  OscalInformationType,
  OscalParty,
  OscalRole,
  OscalSystemCharacteristics,
  OscalSystemId,
} from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TYPED_ROLE_TITLES: Record<Exclude<SystemRoleType, "other">, string> = {
  "system-owner": "System Owner",
  "authorizing-official": "Authorizing Official",
  "system-security-officer": "System Security Officer",
};

export type MappedSystemCharacteristics = {
  characteristics: OscalSystemCharacteristics;
  roles?: OscalRole[];
  parties?: OscalParty[];
  thisSystemStatus: OscalComponent["status"];
};

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function oscalRoleIdFor(role: SystemRole, usedIds: Map<string, number>): string {
  if (role.role !== "other") {
    return role.role;
  }
  const label = nonEmpty(role.otherRoleLabel) ?? "other";
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = slug && /^[a-z_]/.test(slug) ? slug : `other-${slug || "role"}`;
  const count = usedIds.get(base) ?? 0;
  usedIds.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function mapComponentStatus(
  operationalStatus: ProjectMetadata["operationalStatus"],
): OscalComponent["status"] {
  if (operationalStatus === "operational") {
    return { state: "operational" };
  }
  if (operationalStatus === "under-development") {
    return { state: "under-development" };
  }
  if (operationalStatus) {
    return { state: "other" };
  }
  return { state: "under-development" };
}

function mapSystemIds(
  metadata: ProjectMetadata,
  generatedSystemId: string,
): OscalSystemId[] {
  const authored = nonEmpty(metadata.systemIdentifier);
  if (!authored) {
    return [
      {
        "identifier-type": "http://ietf.org/rfc/rfc4122",
        id: generatedSystemId,
      },
    ];
  }
  if (UUID_PATTERN.test(authored)) {
    return [
      {
        "identifier-type": "http://ietf.org/rfc/rfc4122",
        id: authored,
      },
    ];
  }
  return [{ id: authored }];
}

function mapInformationTypes(
  metadata: ProjectMetadata,
  createUuid: () => string,
): OscalInformationType[] {
  const authored = metadata.informationTypes
    .map((item) => {
      const title = nonEmpty(item.title);
      if (!title) {
        return null;
      }
      const mapped: OscalInformationType = {
        uuid: createUuid(),
        title,
        description:
          nonEmpty(item.description) ??
          "Information type description has not been provided.",
      };
      if (item.confidentialityImpact) {
        mapped["confidentiality-impact"] = { base: item.confidentialityImpact };
      }
      if (item.integrityImpact) {
        mapped["integrity-impact"] = { base: item.integrityImpact };
      }
      if (item.availabilityImpact) {
        mapped["availability-impact"] = { base: item.availabilityImpact };
      }
      return mapped;
    })
    .filter((item): item is OscalInformationType => item !== null);

  if (authored.length > 0) {
    return authored;
  }

  return [
    {
      uuid: createUuid(),
      title: "Unspecified",
      description:
        "Information types are not captured in the current application domain model.",
    },
  ];
}

function mapRolesAndParties(
  metadata: ProjectMetadata,
  createUuid: () => string,
): {
  roles?: OscalRole[];
  parties?: OscalParty[];
  responsibleParties?: OscalSystemCharacteristics["responsible-parties"];
} {
  const parties: OscalParty[] = [];
  const organizationName = nonEmpty(metadata.organizationName);
  if (organizationName) {
    parties.push({
      uuid: createUuid(),
      type: "organization",
      name: organizationName,
    });
  }

  const rolesById = new Map<string, OscalRole>();
  const partyUuidsByRole = new Map<string, string[]>();
  const otherIdCounts = new Map<string, number>();

  for (const role of metadata.systemRoles) {
    const name = nonEmpty(role.name);
    if (!name) {
      continue;
    }
    const roleId = oscalRoleIdFor(role, otherIdCounts);
    if (!rolesById.has(roleId)) {
      rolesById.set(roleId, {
        id: roleId,
        title:
          role.role === "other"
            ? nonEmpty(role.otherRoleLabel) ?? "Other"
            : TYPED_ROLE_TITLES[role.role],
      });
    }
    const party: OscalParty = {
      uuid: createUuid(),
      type: "person",
      name,
    };
    const email = nonEmpty(role.email);
    if (email) {
      party["email-addresses"] = [email];
    }
    const phone = nonEmpty(role.phone);
    if (phone) {
      party["telephone-numbers"] = [{ number: phone }];
    }
    const remarks = [
      nonEmpty(role.title) ? `Title: ${role.title?.trim()}` : undefined,
      nonEmpty(role.organization)
        ? `Organization: ${role.organization?.trim()}`
        : undefined,
    ].filter((entry): entry is string => Boolean(entry));
    if (remarks.length > 0) {
      party.remarks = remarks.join(". ");
    }
    parties.push(party);
    const existing = partyUuidsByRole.get(roleId) ?? [];
    existing.push(party.uuid);
    partyUuidsByRole.set(roleId, existing);
  }

  const roles = [...rolesById.values()];
  const responsibleParties = [...partyUuidsByRole.entries()].map(
    ([roleId, uuids]) => ({
      "role-id": roleId,
      "party-uuids": uuids,
    }),
  );

  return {
    ...(roles.length > 0 ? { roles } : {}),
    ...(parties.length > 0 ? { parties } : {}),
    ...(responsibleParties.length > 0 ? { responsibleParties } : {}),
  };
}

/**
 * Conservative NIST OSCAL mapping of authored system characteristics.
 * Missing canonical values stay explicit gaps. Never infers from framework,
 * tenant, or overview-as-boundary.
 */
export function mapSystemCharacteristics(
  metadata: ProjectMetadata,
  options: {
    createUuid: () => string;
    generatedSystemId: string;
  },
): MappedSystemCharacteristics {
  const systemName = nonEmpty(metadata.systemName) ?? "Untitled System";
  const systemDescription = nonEmpty(metadata.systemDescription);
  const authorizationBoundary = nonEmpty(metadata.authorizationBoundary);
  const categorization = metadata.securityCategorization;
  const mappedRoles = mapRolesAndParties(metadata, options.createUuid);

  const characteristics: OscalSystemCharacteristics = {
    "system-ids": mapSystemIds(metadata, options.generatedSystemId),
    "system-name": systemName,
    description:
      systemDescription ?? "System description has not been provided.",
    "system-information": {
      "information-types": mapInformationTypes(metadata, options.createUuid),
    },
    status: metadata.operationalStatus
      ? {
          state: metadata.operationalStatus,
          ...(nonEmpty(metadata.operationalStatusRemarks)
            ? { remarks: metadata.operationalStatusRemarks.trim() }
            : {}),
        }
      : {
          state: "under-development",
          remarks:
            "Operational status is not captured in the current application domain model.",
        },
    "authorization-boundary": {
      description:
        authorizationBoundary ??
        "Authorization boundary has not been documented.",
    },
  };

  const shortName = nonEmpty(metadata.systemNameShort);
  if (shortName) {
    characteristics["system-name-short"] = shortName;
  }

  if (
    categorization?.confidentiality &&
    categorization.integrity &&
    categorization.availability
  ) {
    characteristics["security-impact-level"] = {
      "security-objective-confidentiality": categorization.confidentiality,
      "security-objective-integrity": categorization.integrity,
      "security-objective-availability": categorization.availability,
    };
  }

  if (mappedRoles.responsibleParties) {
    characteristics["responsible-parties"] = mappedRoles.responsibleParties;
  }

  return {
    characteristics,
    roles: mappedRoles.roles,
    parties: mappedRoles.parties,
    thisSystemStatus: mapComponentStatus(metadata.operationalStatus),
  };
}
