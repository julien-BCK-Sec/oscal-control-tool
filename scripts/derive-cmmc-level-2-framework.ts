import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveCmmcLevel2Framework } from "../src/framework/cmmc-level-2-nist-sp-800-171-r2/derive";
import { CMMC_LEVEL_2_IDENTITY } from "../src/framework/cmmc-level-2-nist-sp-800-171-r2/identities";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const csvPath = path.join(
  repoRoot,
  "vendor/nist/sp800-171/r2",
  CMMC_LEVEL_2_IDENTITY.vendorCsvFile,
);
const outputDir = path.join(repoRoot, "src/data/framework/generated");

function main(): void {
  const csvText = readFileSync(csvPath, "utf8");
  const result = deriveCmmcLevel2Framework(csvText, CMMC_LEVEL_2_IDENTITY);
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, CMMC_LEVEL_2_IDENTITY.generatedJsonFile);
  writeFileSync(outputPath, `${JSON.stringify(result.framework, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${result.framework.controls.length} CMMC Level 2 requirements to ${path.relative(repoRoot, outputPath)}`,
  );
}

main();
