import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  InvalidIl4ParameterMappingsError,
  mappingCount,
  parseIl4ParameterMappings,
} from "./parameter-mappings";
import { IL4_PARAMETER_MAPPINGS_VENDOR_FILE } from "./sources";
import type { FrameworkOrganizationDefinedParameter } from "@/data/framework/types";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

const emptyPin = readJson(IL4_PARAMETER_MAPPINGS_VENDOR_FILE);

const ac1Param: FrameworkOrganizationDefinedParameter = {
  id: "ac-01_odp.01",
  label: "frequency",
  description: "the frequency",
  altIdentifiers: [],
  aggregatedParameterIds: [],
};

const catalog = {
  allowedControlIds: new Set(["ac-1"]),
  paramsByControl: new Map([["ac-1", [ac1Param]]]),
};

describe("parseIl4ParameterMappings", () => {
  it("accepts the empty pinned mapping set", () => {
    const index = parseIl4ParameterMappings(emptyPin, catalog);
    assert.equal(mappingCount(index), 0);
  });

  it("rejects unknown parameter IDs", () => {
    const raw = structuredClone(emptyPin) as {
      mappings: unknown[];
    };
    raw.mappings = [
      {
        controlId: "ac-1",
        parameterId: "not-a-real-odp",
        status: "baseline-inherited",
        values: ["3"],
        evidence: "guessed from brackets",
      },
    ];
    assert.throws(
      () => parseIl4ParameterMappings(raw, catalog),
      InvalidIl4ParameterMappingsError,
    );
  });

  it("rejects unknown controls and duplicate mappings", () => {
    const unknownControl = structuredClone(emptyPin) as { mappings: unknown[] };
    unknownControl.mappings = [
      {
        controlId: "xx-99",
        parameterId: "ac-01_odp.01",
        status: "baseline-inherited",
        values: ["3"],
        evidence: "not in population",
      },
    ];
    assert.throws(
      () => parseIl4ParameterMappings(unknownControl, catalog),
      /not in the IL4 population/,
    );

    const duplicate = structuredClone(emptyPin) as { mappings: unknown[] };
    const mapping = {
      controlId: "ac-1",
      parameterId: "ac-01_odp.01",
      status: "baseline-inherited",
      values: ["at least every 3 years"],
      evidence: "FedRAMP AC-1 (c)(1)",
    };
    duplicate.mappings = [mapping, mapping];
    assert.throws(
      () => parseIl4ParameterMappings(duplicate, catalog),
      /duplicate mapping/,
    );
  });

  it("accepts a valid explicit mapping", () => {
    const raw = structuredClone(emptyPin) as { mappings: unknown[] };
    raw.mappings = [
      {
        controlId: "ac-1",
        parameterId: "ac-01_odp.01",
        status: "baseline-inherited",
        values: ["at least every 3 years"],
        evidence: "FedRAMP AC-1 (c)(1) [at least every 3 years]",
      },
    ];
    const index = parseIl4ParameterMappings(raw, catalog);
    assert.equal(mappingCount(index), 1);
    assert.equal(
      index.get("ac-1")?.get("ac-01_odp.01")?.status,
      "baseline-inherited",
    );
  });
});
