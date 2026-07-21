import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImportedProjectName,
  parseLegacyLocalStoragePayloads,
} from "./legacy-migration";

describe("legacy localStorage migration helpers", () => {
  it("detects meaningful metadata-only data", () => {
    const result = parseLegacyLocalStoragePayloads({
      metadataRaw: JSON.stringify({
        version: 1,
        metadata: {
          systemName: "Legacy System",
          organizationName: "",
          systemDescription: "",
        },
      }),
      implementationsRaw: null,
      markerRaw: null,
    });
    assert.equal(result.shouldOfferImport, true);
    assert.equal(result.data.metadata.systemName, "Legacy System");
    assert.equal(buildImportedProjectName(result.data.metadata), "Legacy System");
  });

  it("detects implementations-only data", () => {
    const result = parseLegacyLocalStoragePayloads({
      metadataRaw: null,
      implementationsRaw: JSON.stringify({
        version: 1,
        implementations: {
          "ac-1": { status: "implemented", narrative: "x" },
        },
      }),
      markerRaw: null,
    });
    assert.equal(result.shouldOfferImport, true);
    assert.equal(result.data.implementations["ac-1"]?.narrative, "x");
  });

  it("combines metadata and implementations", () => {
    const result = parseLegacyLocalStoragePayloads({
      metadataRaw: JSON.stringify({
        version: 1,
        metadata: {
          systemName: "Both",
          organizationName: "Org",
          systemDescription: "Desc",
        },
      }),
      implementationsRaw: JSON.stringify({
        version: 1,
        implementations: {
          "ac-2.1": { status: "in-progress", narrative: "enh" },
        },
      }),
      markerRaw: null,
    });
    assert.equal(result.shouldOfferImport, true);
    assert.equal(result.data.implementations["ac-2.1"]?.status, "in-progress");
  });

  it("treats malformed payloads as empty and not importable", () => {
    const result = parseLegacyLocalStoragePayloads({
      metadataRaw: "{bad",
      implementationsRaw: "not-json",
      markerRaw: null,
    });
    assert.equal(result.shouldOfferImport, false);
    assert.equal(result.data.hasMeaningfulData, false);
  });

  it("does not offer import when migration marker exists", () => {
    const result = parseLegacyLocalStoragePayloads({
      metadataRaw: JSON.stringify({
        version: 1,
        metadata: {
          systemName: "Already",
          organizationName: "",
          systemDescription: "",
        },
      }),
      implementationsRaw: null,
      markerRaw: JSON.stringify({
        projectId: "abc",
        importedAt: "2026-07-21T00:00:00.000Z",
      }),
    });
    assert.equal(result.shouldOfferImport, false);
    assert.ok(result.marker);
  });
});
