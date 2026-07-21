import type { Framework, FrameworkControl } from "@/data/framework/types";

/** Application constants for the NIST Moderate framework. */
export const NIST_MODERATE_FRAMEWORK_ID = "nist-sp-800-53-rev5-moderate";
export const NIST_MODERATE_FRAMEWORK_SOURCE =
  "NIST SP 800-53 Rev. 5 Moderate";
export const NIST_MODERATE_FRAMEWORK_TITLE =
  "NIST SP 800-53 Revision 5 Moderate Baseline";

/**
 * Profile features supported by this narrow resolver.
 * Anything else that would change the selected framework causes a hard failure.
 */
export const SUPPORTED_NIST_MODERATE_PROFILE_FEATURES = [
  "profile.uuid",
  "profile.metadata",
  "profile.imports[].href",
  "profile.imports[].include-controls[].with-ids",
  "profile.merge.as-is (must be true)",
  "profile.back-matter.resources (ignored for local pin pairing)",
] as const;

/**
 * Features that are not implemented. Presence on the pinned profile that
 * would alter selection or control content causes derivation to fail.
 */
export const UNSUPPORTED_PROFILE_FEATURES_THAT_ALTER_FRAMEWORK = [
  "imports[].include-controls[].include-all",
  "imports[].include-controls[].with-child-controls",
  "imports[].include-controls[].matching",
  "imports[].exclude-controls",
  "modify (set-parameters, alters, …)",
  "merge strategies other than as-is: true",
  "insert-controls",
  "following remote import hrefs (local pinned catalog is paired instead)",
] as const;

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
  class?: string;
  parts?: CatalogPart[];
  controls?: CatalogControlNode[];
};

type CatalogGroup = {
  id?: string;
  title?: string;
  controls?: CatalogControlNode[];
};

type IndexedControl = {
  id: string;
  title: string;
  family: string;
  statementPart: CatalogPart | undefined;
  class: string | undefined;
};

export type FrameworkDerivationFailure = {
  ok: false;
  message: string;
  unresolvedReferences: string[];
  unsupportedFeatures: string[];
};

export type FrameworkDerivationSuccess = {
  ok: true;
  framework: Framework;
  unresolvedReferences: [];
  unsupportedFeatures: [];
  /** Control IDs that contain a '.' (catalog enhancements). */
  enhancementIds: string[];
};

export type FrameworkDerivationResult =
  | FrameworkDerivationSuccess
  | FrameworkDerivationFailure;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertKeys(
  object: JsonObject,
  allowed: readonly string[],
  path: string,
  unsupported: string[],
): void {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) {
      unsupported.push(`${path}.${key}`);
    }
  }
}

/**
 * Normalize an OSCAL statement part tree into a plain string.
 *
 * - Uses only the part named "statement" (never guidance/discussion).
 * - Flattens nested `item` parts with their label props.
 * - Preserves catalog parameter insert tokens such as
 *   `{{ insert: param, ac-1_prm_1 }}`.
 */
export function normalizeStatementText(
  statementPart: CatalogPart | undefined,
): string {
  if (!statementPart) {
    return "";
  }

  const lines: string[] = [];

  function walk(part: CatalogPart): void {
    const label = part.props?.find((prop) => prop.name === "label")?.value;
    const prose = part.prose?.trim();

    if (label && prose) {
      lines.push(`${label} ${prose}`);
    } else if (prose) {
      lines.push(prose);
    } else if (label) {
      lines.push(label);
    }

    for (const child of part.parts ?? []) {
      walk(child);
    }
  }

  walk(statementPart);
  return lines.join("\n").trim();
}

function indexCatalog(catalogRoot: unknown): {
  byId: Map<string, IndexedControl>;
  sourceVersion: string;
} {
  if (!isObject(catalogRoot) || !isObject(catalogRoot.catalog)) {
    throw new Error("Catalog root must contain a catalog object.");
  }

  const catalog = catalogRoot.catalog;
  const metadata = isObject(catalog.metadata) ? catalog.metadata : {};
  const sourceVersion =
    typeof metadata.version === "string" ? metadata.version : "unknown";

  const byId = new Map<string, IndexedControl>();

  function indexControls(
    controls: unknown,
    familyTitle: string,
  ): void {
    if (!Array.isArray(controls)) {
      return;
    }

    for (const raw of controls) {
      if (!isObject(raw)) {
        continue;
      }
      const node = raw as CatalogControlNode;
      if (typeof node.id !== "string" || typeof node.title !== "string") {
        continue;
      }

      const statementPart = node.parts?.find((part) => part.name === "statement");
      byId.set(node.id, {
        id: node.id,
        title: node.title,
        family: familyTitle,
        statementPart,
        class: node.class,
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
    const familyTitle =
      typeof group.title === "string" ? group.title : "Unknown";
    indexControls(group.controls, familyTitle);
  }

  return { byId, sourceVersion };
}

/**
 * Validate that the profile only uses features this resolver supports,
 * then return selected control IDs in profile order.
 */
function selectControlIdsFromProfile(profileRoot: unknown): {
  selectedIds: string[];
  unsupportedFeatures: string[];
} {
  const unsupportedFeatures: string[] = [];

  if (!isObject(profileRoot) || !isObject(profileRoot.profile)) {
    return {
      selectedIds: [],
      unsupportedFeatures: ["profile root missing profile object"],
    };
  }

  const profile = profileRoot.profile;
  assertKeys(
    profile,
    ["uuid", "metadata", "imports", "merge", "back-matter"],
    "profile",
    unsupportedFeatures,
  );

  if (isObject(profile.merge)) {
    assertKeys(profile.merge, ["as-is"], "profile.merge", unsupportedFeatures);
    if (profile.merge["as-is"] !== true) {
      unsupportedFeatures.push(
        "profile.merge.as-is must be true (other merge strategies are unsupported)",
      );
    }
  } else if (profile.merge !== undefined) {
    unsupportedFeatures.push("profile.merge must be an object when present");
  }

  if (profile.modify !== undefined) {
    unsupportedFeatures.push("profile.modify");
  }

  if (!Array.isArray(profile.imports) || profile.imports.length === 0) {
    unsupportedFeatures.push("profile.imports must be a non-empty array");
    return { selectedIds: [], unsupportedFeatures };
  }

  const selectedIds: string[] = [];

  for (let importIndex = 0; importIndex < profile.imports.length; importIndex += 1) {
    const imp = profile.imports[importIndex];
    const importPath = `profile.imports[${importIndex}]`;
    if (!isObject(imp)) {
      unsupportedFeatures.push(`${importPath} must be an object`);
      continue;
    }

    assertKeys(
      imp,
      ["href", "include-controls"],
      importPath,
      unsupportedFeatures,
    );

    if (imp["exclude-controls"] !== undefined) {
      unsupportedFeatures.push(`${importPath}.exclude-controls`);
    }

    if (!Array.isArray(imp["include-controls"])) {
      unsupportedFeatures.push(
        `${importPath}.include-controls must be an array`,
      );
      continue;
    }

    for (
      let blockIndex = 0;
      blockIndex < imp["include-controls"].length;
      blockIndex += 1
    ) {
      const block = imp["include-controls"][blockIndex];
      const blockPath = `${importPath}.include-controls[${blockIndex}]`;
      if (!isObject(block)) {
        unsupportedFeatures.push(`${blockPath} must be an object`);
        continue;
      }

      assertKeys(block, ["with-ids"], blockPath, unsupportedFeatures);

      for (const key of [
        "include-all",
        "with-child-controls",
        "matching",
      ] as const) {
        if (block[key] !== undefined) {
          unsupportedFeatures.push(`${blockPath}.${key}`);
        }
      }

      const withIds = block["with-ids"];
      if (!Array.isArray(withIds) || withIds.length === 0) {
        unsupportedFeatures.push(
          `${blockPath}.with-ids must be a non-empty array`,
        );
        continue;
      }

      for (const id of withIds) {
        if (typeof id !== "string" || id.length === 0) {
          unsupportedFeatures.push(
            `${blockPath}.with-ids contains a non-string id`,
          );
          continue;
        }
        selectedIds.push(id);
      }
    }
  }

  return { selectedIds, unsupportedFeatures };
}

/**
 * Derive the application Framework from a pinned NIST Moderate profile + catalog.
 *
 * Does not follow profile import hrefs; callers must pass the paired local catalog.
 * Fails clearly on unsupported profile features or unresolved control IDs.
 */
export function deriveNistModerateFramework(
  profileRoot: unknown,
  catalogRoot: unknown,
): FrameworkDerivationResult {
  const { selectedIds, unsupportedFeatures } =
    selectControlIdsFromProfile(profileRoot);

  if (unsupportedFeatures.length > 0) {
    return {
      ok: false,
      message: `Unsupported OSCAL profile features: ${unsupportedFeatures.join("; ")}`,
      unresolvedReferences: [],
      unsupportedFeatures,
    };
  }

  let byId: Map<string, IndexedControl>;
  let sourceVersion: string;
  try {
    ({ byId, sourceVersion } = indexCatalog(catalogRoot));
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to index catalog controls.",
      unresolvedReferences: [],
      unsupportedFeatures: [],
    };
  }

  const unresolvedReferences: string[] = [];
  const controls: FrameworkControl[] = [];
  const enhancementIds: string[] = [];

  for (const controlId of selectedIds) {
    const indexed = byId.get(controlId);
    if (!indexed) {
      unresolvedReferences.push(controlId);
      continue;
    }

    const statement = normalizeStatementText(indexed.statementPart);
    if (!statement) {
      unresolvedReferences.push(`${controlId} (missing statement)`);
      continue;
    }

    if (controlId.includes(".")) {
      enhancementIds.push(controlId);
    }

    controls.push({
      id: indexed.id,
      title: indexed.title,
      family: indexed.family,
      statement,
      source: NIST_MODERATE_FRAMEWORK_SOURCE,
      sourceVersion,
    });
  }

  if (unresolvedReferences.length > 0) {
    return {
      ok: false,
      message: `Unresolved profile control references: ${unresolvedReferences.join(", ")}`,
      unresolvedReferences,
      unsupportedFeatures: [],
    };
  }

  const framework: Framework = {
    id: NIST_MODERATE_FRAMEWORK_ID,
    title: NIST_MODERATE_FRAMEWORK_TITLE,
    source: NIST_MODERATE_FRAMEWORK_SOURCE,
    sourceVersion,
    controls,
  };

  return {
    ok: true,
    framework,
    unresolvedReferences: [],
    unsupportedFeatures: [],
    enhancementIds,
  };
}
