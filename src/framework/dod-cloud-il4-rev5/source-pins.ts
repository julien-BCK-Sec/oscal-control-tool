/**
 * Pinned source records copied from the generated IL4 artifact.
 * The renderer does not invent publisher titles or hashes.
 */

import generatedDodCloudIl4 from "@/data/framework/generated/dod-cloud-il4-rev5.json";

export type Il4SourcePin = {
  role: string;
  publisher: string;
  title: string;
  version: string;
  sha256: string;
};

function requirePinField(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`DoD IL4 source pin is missing ${label}.`);
  }
  return value.trim();
}

export function dodCloudIl4SourcePins(): readonly Il4SourcePin[] {
  const sources = generatedDodCloudIl4.sources;
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("DoD IL4 artifact is missing source pins.");
  }
  return sources.map((source) => {
    const sha256 = requirePinField(source.sha256, "sha256");
    if (!/^[a-f0-9]{64}$/i.test(sha256)) {
      throw new Error(`DoD IL4 source pin ${source.role ?? ""} has an invalid sha256.`);
    }
    return {
      role: requirePinField(source.role, "role"),
      publisher: requirePinField(source.publisher, "publisher"),
      title: requirePinField(source.title, "title"),
      version: requirePinField(source.version, "version"),
      sha256,
    };
  });
}
