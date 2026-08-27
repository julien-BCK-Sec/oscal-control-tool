import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { deriveNistSp80053Rev5Framework } from "./derive";
import {
  NIST_HIGH_IDENTITY,
  NIST_LOW_IDENTITY,
  NIST_MODERATE_IDENTITY,
} from "./identities";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function loadJson(relativePath: string): unknown {
  return JSON.parse(
    readFileSync(path.join(repoRoot, relativePath), "utf8"),
  ) as unknown;
}

function profileSelectedIds(profileRoot: unknown): string[] {
  const profile = (
    profileRoot as {
      profile: {
        imports: Array<{
          "include-controls": Array<{ "with-ids": string[] }>;
        }>;
      };
    }
  ).profile;
  return profile.imports.flatMap((imp) =>
    imp["include-controls"].flatMap((block) => block["with-ids"]),
  );
}

const catalogRoot = loadJson(
  "vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json",
);

describe("deriveNistSp80053Rev5Framework Low/Moderate/High", () => {
  const cases = [
    {
      identity: NIST_LOW_IDENTITY,
      profileFile:
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_LOW-baseline_profile.json",
    },
    {
      identity: NIST_MODERATE_IDENTITY,
      profileFile:
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
    },
    {
      identity: NIST_HIGH_IDENTITY,
      profileFile:
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
    },
  ] as const;

  for (const { identity, profileFile } of cases) {
    it(`derives ${identity.profile} from the pinned profile with-ids`, () => {
      const profileRoot = loadJson(profileFile);
      const selectedIds = profileSelectedIds(profileRoot);
      const result = deriveNistSp80053Rev5Framework(
        profileRoot,
        catalogRoot,
        identity,
      );
      assert.equal(result.ok, true);
      if (!result.ok) {
        return;
      }
      assert.equal(result.framework.id, identity.id);
      assert.equal(result.framework.title, identity.title);
      assert.deepEqual(
        result.framework.controls.map((control) => control.id),
        selectedIds,
      );
      assert.ok(selectedIds.includes("ac-1"));
      assert.ok(selectedIds.includes("ac-2"));
      const ac1 = result.framework.controls.find((control) => control.id === "ac-1");
      assert.ok(ac1);
      const odp03 = ac1.parameters?.organizationDefined.find(
        (param) => param.id === "ac-01_odp.03",
      );
      assert.ok(odp03);
      assert.deepEqual(odp03.select?.choices, [
        "organization-level",
        "mission/business process-level",
        "system-level",
      ]);
    });
  }

  it("preserves AC-6(1) catalog parameter labels for authoring", () => {
    const moderate = deriveNistSp80053Rev5Framework(
      loadJson(
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
      ),
      catalogRoot,
      NIST_MODERATE_IDENTITY,
    );
    assert.equal(moderate.ok, true);
    if (!moderate.ok) {
      return;
    }
    const ac61 = moderate.framework.controls.find((control) => control.id === "ac-6.1");
    assert.ok(ac61);
    assert.match(ac61.statement, /\{\{\s*insert:\s*param,\s*ac-06\.01_odp\.01/);
    const byId = new Map(
      (ac61.parameters?.organizationDefined ?? []).map((param) => [param.id, param]),
    );
    assert.equal(byId.get("ac-06.01_odp.01")?.label, "individuals and roles");
    assert.equal(
      byId.get("ac-6.1_prm_2")?.label,
      "organization-defined security functions (deployed in hardware, software, and firmware)",
    );
    assert.equal(byId.get("ac-06.01_odp.05")?.label, "security-relevant information");
  });

  it("keeps Low a subset of Moderate and Moderate a subset of High", () => {
    const low = deriveNistSp80053Rev5Framework(
      loadJson(
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_LOW-baseline_profile.json",
      ),
      catalogRoot,
      NIST_LOW_IDENTITY,
    );
    const moderate = deriveNistSp80053Rev5Framework(
      loadJson(
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
      ),
      catalogRoot,
      NIST_MODERATE_IDENTITY,
    );
    const high = deriveNistSp80053Rev5Framework(
      loadJson(
        "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
      ),
      catalogRoot,
      NIST_HIGH_IDENTITY,
    );
    assert.equal(low.ok && moderate.ok && high.ok, true);
    if (!low.ok || !moderate.ok || !high.ok) {
      return;
    }
    const lowIds = new Set(low.framework.controls.map((c) => c.id));
    const moderateIds = new Set(moderate.framework.controls.map((c) => c.id));
    const highIds = new Set(high.framework.controls.map((c) => c.id));
    assert.ok(lowIds.size < moderateIds.size);
    assert.ok(moderateIds.size < highIds.size);
    for (const id of lowIds) {
      assert.ok(moderateIds.has(id), `Low ${id} missing from Moderate`);
    }
    for (const id of moderateIds) {
      assert.ok(highIds.has(id), `Moderate ${id} missing from High`);
    }
  });
});
