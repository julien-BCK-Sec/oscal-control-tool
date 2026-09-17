import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  catalogUnassignedResolutions,
  extractOrganizationDefinedParameters,
  isAggregateCatalogParameter,
} from "./parameters";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const catalogRoot = JSON.parse(
  readFileSync(
    path.join(
      repoRoot,
      "vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json",
    ),
    "utf8",
  ),
) as {
  catalog: {
    groups: Array<{
      controls?: Array<{
        id?: string;
        params?: unknown[];
        controls?: Array<{ id?: string; params?: unknown[] }>;
      }>;
    }>;
  };
};

function findControlParams(id: string): unknown[] | undefined {
  function walk(
    controls: Array<{
      id?: string;
      params?: unknown[];
      controls?: Array<{ id?: string; params?: unknown[] }>;
    }>,
  ): unknown[] | undefined {
    for (const control of controls) {
      if (control.id === id) {
        return control.params;
      }
      if (control.controls) {
        const nested = walk(control.controls);
        if (nested) {
          return nested;
        }
      }
    }
    return undefined;
  }
  for (const group of catalogRoot.catalog.groups) {
    const found = walk(group.controls ?? []);
    if (found) {
      return found;
    }
  }
  return undefined;
}

describe("extractOrganizationDefinedParameters", () => {
  it("materializes omitted how-many as one and nested select inserts", () => {
    const params = extractOrganizationDefinedParameters(
      findControlParams("ac-7") as never,
    );
    const odp03 = params.find((param) => param.id === "ac-07_odp.03");
    assert.ok(odp03?.select);
    assert.equal(odp03.select.howMany, "one-or-more");
    assert.deepEqual(odp03.select.choices[0]?.nestedParameterIds, [
      "ac-07_odp.04",
    ]);
    assert.ok(
      odp03.altIdentifiers.some((id) => id.includes("prm")),
    );
  });

  it("preserves aggregate grouping and child ODP identity", () => {
    const params = extractOrganizationDefinedParameters(
      findControlParams("ac-6.1") as never,
    );
    const aggregate = params.find((param) => param.id === "ac-6.1_prm_2");
    assert.ok(aggregate);
    assert.equal(isAggregateCatalogParameter(aggregate), true);
    assert.ok(aggregate.aggregatedParameterIds.length > 0);
    assert.ok(
      aggregate.aggregatedParameterIds.every((id) =>
        params.some((param) => param.id === id),
      ),
    );
  });

  it("materializes omitted how-many as one", () => {
    const params = extractOrganizationDefinedParameters(
      findControlParams("ac-2.2") as never,
    );
    const odp = params.find((param) => param.id === "ac-02.02_odp.01");
    assert.ok(odp?.select);
    assert.equal(odp.select.howMany, "one");
  });

  it("builds catalog-unassigned resolutions without inventing values", () => {
    const params = extractOrganizationDefinedParameters(
      findControlParams("ac-1") as never,
    );
    const rows = catalogUnassignedResolutions("ac-1", params);
    assert.equal(rows.length, params.length);
    assert.ok(
      rows.every(
        (row) =>
          row.controlId === "ac-1" &&
          row.status === "csp-organization-defined" &&
          row.mappingBasis === "catalog-unassigned" &&
          row.values.length === 0,
      ),
    );
  });
});
