import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  FRAMEWORK,
  FRAMEWORK_CONTROLS,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import {
  deriveNistModerateFramework,
  normalizeStatementText,
} from "@/framework/nist-moderate/derive";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const profilePath = path.join(
  repoRoot,
  "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
);
const catalogPath = path.join(
  repoRoot,
  "vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json",
);

function loadJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function profileSelectedIds(profileRoot: unknown): string[] {
  const profile = (profileRoot as { profile: { imports: Array<{
    "include-controls": Array<{ "with-ids": string[] }>;
  }> } }).profile;
  return profile.imports.flatMap((imp) =>
    imp["include-controls"].flatMap((block) => block["with-ids"]),
  );
}

function catalogControl(
  catalogRoot: unknown,
  controlId: string,
): { title: string; statementPart: unknown } {
  const catalog = (catalogRoot as {
    catalog: {
      groups: Array<{
        controls?: Array<{
          id: string;
          title: string;
          parts?: unknown[];
          controls?: unknown[];
        }>;
      }>;
    };
  }).catalog;

  type Node = {
    id: string;
    title: string;
    parts?: Array<{ name?: string; prose?: string; parts?: unknown[] }>;
    controls?: Node[];
  };

  function find(nodes: Node[] | undefined): Node | undefined {
    for (const node of nodes ?? []) {
      if (node.id === controlId) {
        return node;
      }
      const nested = find(node.controls);
      if (nested) {
        return nested;
      }
    }
    return undefined;
  }

  for (const group of catalog.groups) {
    const found = find(group.controls as Node[] | undefined);
    if (found) {
      const statementPart = found.parts?.find((part) => part.name === "statement");
      return { title: found.title, statementPart };
    }
  }

  throw new Error(`Control ${controlId} not found in catalog`);
}

describe("deriveNistModerateFramework", () => {
  const profileRoot = loadJson(profilePath);
  const catalogRoot = loadJson(catalogPath);
  const selectedIds = profileSelectedIds(profileRoot);
  const result = deriveNistModerateFramework(profileRoot, catalogRoot);

  it("derives more controls than the previous five-control MVP subset", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.ok(result.framework.controls.length > 5);
    assert.equal(result.framework.controls.length, selectedIds.length);
  });

  it("includes AC-1 and AC-2", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const ids = new Set(result.framework.controls.map((control) => control.id));
    assert.ok(ids.has("ac-1"));
    assert.ok(ids.has("ac-2"));
  });

  it("includes at least one enhancement as a distinct control id", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.ok(result.enhancementIds.length > 0);
    assert.ok(result.enhancementIds.includes("ac-2.1"));
    assert.ok(
      result.framework.controls.some((control) => control.id === "ac-2.1"),
    );
  });

  it("omits catalog controls not selected by the Moderate profile", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const ids = new Set(result.framework.controls.map((control) => control.id));
    assert.equal(ids.has("ac-2.6"), false);
    assert.ok(selectedIds.includes("ac-2") || selectedIds.includes("ac-2.1"));
    assert.equal(selectedIds.includes("ac-2.6"), false);
  });

  it("uses official catalog titles", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const ac1 = result.framework.controls.find((control) => control.id === "ac-1");
    const catalogAc1 = catalogControl(catalogRoot, "ac-1");
    assert.ok(ac1);
    assert.equal(ac1.title, catalogAc1.title);
    assert.equal(ac1.title, "Policy and Procedures");
  });

  it("uses official catalog statement text (not guidance)", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const ac21 = result.framework.controls.find(
      (control) => control.id === "ac-2.1",
    );
    const catalogAc21 = catalogControl(catalogRoot, "ac-2.1");
    assert.ok(ac21);
    const expected = normalizeStatementText(
      catalogAc21.statementPart as {
        name?: string;
        prose?: string;
        props?: Array<{ name?: string; value?: string }>;
        parts?: unknown[];
      },
    );
    assert.equal(ac21.statement, expected);
    assert.match(ac21.statement, /Support the management of system accounts/);
    assert.equal(ac21.statement.includes("guidance"), false);
  });

  it("resolves every selected profile control successfully", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.unresolvedReferences, []);
    assert.deepEqual(
      result.framework.controls.map((control) => control.id),
      selectedIds,
    );
  });

  it("produces deterministic ordering matching the profile with-ids order", () => {
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const first = deriveNistModerateFramework(profileRoot, catalogRoot);
    const second = deriveNistModerateFramework(profileRoot, catalogRoot);
    assert.equal(first.ok && second.ok, true);
    if (!first.ok || !second.ok) {
      return;
    }
    assert.deepEqual(
      first.framework.controls.map((control) => control.id),
      second.framework.controls.map((control) => control.id),
    );
    assert.deepEqual(
      first.framework.controls.map((control) => control.id),
      selectedIds,
    );
  });

  it("fails clearly when an unsupported profile feature is present", () => {
    const mutated = structuredClone(profileRoot) as {
      profile: {
        imports: Array<Record<string, unknown>>;
      };
    };
    mutated.profile.imports[0]["exclude-controls"] = [
      { "with-ids": ["ac-1"] },
    ];

    const failed = deriveNistModerateFramework(mutated, catalogRoot);
    assert.equal(failed.ok, false);
    if (failed.ok) {
      return;
    }
    assert.ok(
      failed.unsupportedFeatures.some((feature) =>
        feature.includes("exclude-controls"),
      ),
    );
  });

  it("reports unresolved references instead of skipping them", () => {
    const mutated = structuredClone(profileRoot) as {
      profile: {
        imports: Array<{
          "include-controls": Array<{ "with-ids": string[] }>;
        }>;
      };
    };
    mutated.profile.imports[0]["include-controls"][0]["with-ids"] = [
      "ac-1",
      "not-a-real-control",
    ];

    const failed = deriveNistModerateFramework(mutated, catalogRoot);
    assert.equal(failed.ok, false);
    if (failed.ok) {
      return;
    }
    assert.deepEqual(failed.unresolvedReferences, ["not-a-real-control"]);
  });
});

describe("nistModerateFrameworkProvider", () => {
  it("exposes application Framework types from generated data", () => {
    const framework = nistModerateFrameworkProvider.getFramework();
    assert.equal(framework.id, FRAMEWORK.id);
    assert.ok(FRAMEWORK_CONTROLS.length > 5);
    assert.equal(FRAMEWORK_CONTROLS, framework.controls);
    assert.ok(FRAMEWORK_CONTROLS.some((control) => control.id === "ac-1"));
  });
});
