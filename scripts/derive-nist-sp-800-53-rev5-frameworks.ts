import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveNistSp80053Rev5Framework } from "../src/framework/nist-sp-800-53-rev5/derive";
import { NIST_SP80053_REV5_IDENTITIES } from "../src/framework/nist-sp-800-53-rev5/identities";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const vendorProfiles = path.join(repoRoot, "vendor/oscal/v1.2.2/profiles");
const catalogPath = path.join(
  repoRoot,
  "vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json",
);
const outputDir = path.join(repoRoot, "src/data/framework/generated");

function main(): void {
  const catalogRoot = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;
  mkdirSync(outputDir, { recursive: true });

  for (const identity of NIST_SP80053_REV5_IDENTITIES) {
    const profilePath = path.join(vendorProfiles, identity.vendorProfileFile);
    const profileRoot = JSON.parse(readFileSync(profilePath, "utf8")) as unknown;
    const result = deriveNistSp80053Rev5Framework(
      profileRoot,
      catalogRoot,
      identity,
    );
    if (!result.ok) {
      console.error(`${identity.id}: ${result.message}`);
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

    const outputPath = path.join(outputDir, identity.generatedJsonFile);
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
}

main();
