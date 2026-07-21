import {
  DEFAULT_PROJECT_METADATA,
  normalizeProjectMetadata,
  type ProjectMetadata,
} from "@/data/project";
import {
  parseStoredImplementations,
  type ControlImplementation,
} from "@/data/implementation";
import { parseStoredProjectMetadata } from "@/data/project/storage";
import {
  LEGACY_IMPLEMENTATION_STORAGE_KEY,
  LEGACY_PROJECT_METADATA_STORAGE_KEY,
  LOCAL_STORAGE_MIGRATION_MARKER_KEY,
} from "@/persistence/constants";

export type LegacyMigrationMarker = {
  projectId: string;
  importedAt: string;
};

export type LegacyLocalData = {
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
  hasMeaningfulData: boolean;
};

export function parseMigrationMarker(
  raw: string | null,
): LegacyMigrationMarker | null {
  if (raw === null || raw.trim() === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.projectId !== "string" ||
      record.projectId.trim() === "" ||
      typeof record.importedAt !== "string"
    ) {
      return null;
    }
    return {
      projectId: record.projectId,
      importedAt: record.importedAt,
    };
  } catch {
    return null;
  }
}

export function isMeaningfulLegacyData(input: {
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
}): boolean {
  const { metadata, implementations } = input;
  if (Object.keys(implementations).length > 0) {
    return true;
  }
  return (
    metadata.systemName.trim() !== "" ||
    metadata.organizationName.trim() !== "" ||
    metadata.systemDescription.trim() !== ""
  );
}

/**
 * Pure helper for tests and client detection: parse legacy localStorage values.
 */
export function parseLegacyLocalStoragePayloads(input: {
  metadataRaw: string | null;
  implementationsRaw: string | null;
  markerRaw: string | null;
}): {
  data: LegacyLocalData;
  marker: LegacyMigrationMarker | null;
  shouldOfferImport: boolean;
} {
  const metadata = parseStoredProjectMetadata(input.metadataRaw);
  const implementations = parseStoredImplementations(input.implementationsRaw);
  const marker = parseMigrationMarker(input.markerRaw);
  const hasMeaningfulData = isMeaningfulLegacyData({
    metadata,
    implementations,
  });

  return {
    data: {
      metadata: normalizeProjectMetadata(metadata),
      implementations,
      hasMeaningfulData,
    },
    marker,
    shouldOfferImport: hasMeaningfulData && marker === null,
  };
}

export function readLegacyLocalStorageFromWindow(
  storage: Storage,
): ReturnType<typeof parseLegacyLocalStoragePayloads> {
  return parseLegacyLocalStoragePayloads({
    metadataRaw: storage.getItem(LEGACY_PROJECT_METADATA_STORAGE_KEY),
    implementationsRaw: storage.getItem(LEGACY_IMPLEMENTATION_STORAGE_KEY),
    markerRaw: storage.getItem(LOCAL_STORAGE_MIGRATION_MARKER_KEY),
  });
}

export function writeMigrationMarker(
  storage: Storage,
  marker: LegacyMigrationMarker,
): void {
  storage.setItem(
    LOCAL_STORAGE_MIGRATION_MARKER_KEY,
    JSON.stringify(marker),
  );
}

export function buildImportedProjectName(metadata: ProjectMetadata): string {
  const system = metadata.systemName.trim();
  if (system) {
    return system;
  }
  return "Imported browser project";
}

export { DEFAULT_PROJECT_METADATA };
