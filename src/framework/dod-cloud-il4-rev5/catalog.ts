import { normalizeStatementText } from "@/framework/nist-sp-800-53-rev5/derive";
import { extractOrganizationDefinedParameters } from "@/framework/nist-sp-800-53-rev5/parameters";
import type { NistOrganizationDefinedParameter } from "./types";

type JsonObject = Record<string, unknown>;

type CatalogPart = {
  name?: string;
  prose?: string;
  props?: Array<{ name?: string; value?: string }>;
  parts?: CatalogPart[];
};

type CatalogControlNode = {
  id?: string;
  title?: string;
  params?: Array<{
    id?: string;
    label?: string;
    guidelines?: Array<{ prose?: string }>;
    select?: { "how-many"?: string; choice?: unknown[] };
  }>;
  parts?: CatalogPart[];
  controls?: CatalogControlNode[];
};

type CatalogGroup = {
  title?: string;
  controls?: CatalogControlNode[];
};

export type IndexedCatalogControl = {
  id: string;
  title: string;
  family: string;
  statement: string;
  parameters: NistOrganizationDefinedParameter[];
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asControl(raw: unknown): CatalogControlNode | undefined {
  return isObject(raw) ? (raw as CatalogControlNode) : undefined;
}

export type IndexedNistCatalog = {
  sourceVersion: string;
  byId: Map<string, IndexedCatalogControl>;
};

export function indexNistCatalog(catalogRoot: unknown): IndexedNistCatalog {
  if (!isObject(catalogRoot) || !isObject(catalogRoot.catalog)) {
    throw new Error("Catalog root must contain a catalog object.");
  }
  const catalog = catalogRoot.catalog;
  const metadata = isObject(catalog.metadata) ? catalog.metadata : {};
  const sourceVersion =
    typeof metadata.version === "string" ? metadata.version : "unknown";
  const byId = new Map<string, IndexedCatalogControl>();

  function indexControls(controls: unknown, familyTitle: string): void {
    if (!Array.isArray(controls)) {
      return;
    }
    for (const raw of controls) {
      const node = asControl(raw);
      if (!node || typeof node.id !== "string" || typeof node.title !== "string") {
        continue;
      }
      const statementPart = node.parts?.find((part) => part.name === "statement");
      byId.set(node.id, {
        id: node.id,
        title: node.title,
        family: familyTitle,
        statement: normalizeStatementText(statementPart),
        parameters: extractOrganizationDefinedParameters(node.params),
      });
      indexControls(node.controls, familyTitle);
    }
  }

  const groups = catalog.groups;
  if (!Array.isArray(groups)) {
    throw new Error("Catalog is missing groups[].");
  }
  for (const rawGroup of groups) {
    if (!isObject(rawGroup)) {
      continue;
    }
    const group = rawGroup as CatalogGroup;
    const familyTitle = typeof group.title === "string" ? group.title : "Unknown";
    indexControls(group.controls, familyTitle);
  }

  return { sourceVersion, byId };
}

/**
 * Read `with-ids` from the pinned NIST Moderate profile for provenance
 * comparison only. This is not the IL4 selection base.
 */
export function nistProfileSelectedIds(profileRoot: unknown): string[] {
  if (!isObject(profileRoot) || !isObject(profileRoot.profile)) {
    throw new Error("NIST profile root is missing profile object.");
  }
  const profile = profileRoot.profile;
  if (profile.modify !== undefined) {
    throw new Error("NIST profile contains modify; unexpected for pinned baselines.");
  }
  const imports = profile.imports;
  if (!Array.isArray(imports)) {
    throw new Error("NIST profile is missing imports[].");
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const rawImport of imports) {
    if (!isObject(rawImport)) {
      continue;
    }
    const include = rawImport["include-controls"];
    if (!Array.isArray(include)) {
      continue;
    }
    for (const rawInclude of include) {
      if (!isObject(rawInclude)) {
        continue;
      }
      const withIds = rawInclude["with-ids"];
      if (!Array.isArray(withIds)) {
        continue;
      }
      for (const rawId of withIds) {
        if (typeof rawId !== "string" || seen.has(rawId)) {
          continue;
        }
        seen.add(rawId);
        ids.push(rawId);
      }
    }
  }
  return ids;
}
