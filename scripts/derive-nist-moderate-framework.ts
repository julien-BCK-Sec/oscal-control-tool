import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveNistModerateFramework } from "../src/framework/nist-moderate/derive";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const profilePath = path.join(
  repoRoot,
  "vendor/oscal/v1.2.2/profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
);
const catalogPath = path.join(
  repoRoot,
  "vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json",
);
const outputPath = path.join(
  repoRoot,
  "src/data/framework/generated/nist-sp-800-53-rev5-moderate.json",
);

function main(): void {
  const profileRoot = JSON.parse(readFileSync(profilePath, "utf8")) as unknown;
  const catalogRoot = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;

  const result = deriveNistModerateFramework(profileRoot, catalogRoot);
  if (!result.ok) {
    console.error(result.message);
    if (result.unsupportedFeatures.length > 0) {
      console.error(
        "Unsupported features:",
        result.unsupportedFeatures.join("\n  - "),
      );
    }
    if (result.unresolvedReferences.length > 0) {
      console.error(
        "Unresolved references:",
        result.unresolvedReferences.join(", "),
      );
    }
    process.exit(1);
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${JSON.stringify(result.framework, null, 2)}\n`,
    "utf8",
  );

  const enhancementCount = result.enhancementIds.length;
  const baseCount = result.framework.controls.length - enhancementCount;
  console.log(
    `Wrote ${result.framework.controls.length} controls (${baseCount} base, ${enhancementCount} enhancements) to ${path.relative(repoRoot, outputPath)}`,
  );
}

main();
