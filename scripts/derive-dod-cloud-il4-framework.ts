import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nistProfileSelectedIds } from "../src/framework/dod-cloud-il4-rev5/catalog";
import { deriveDodCloudIl4Framework } from "../src/framework/dod-cloud-il4-rev5/derive";
import {
  DOD_CLOUD_IL4_GENERATED_JSON_FILE,
  IL4_TOTAL_COUNT,
} from "../src/framework/dod-cloud-il4-rev5/identities";
import { extractAddendumIl4Moderate, parseAddendumExtract } from "../src/framework/dod-cloud-il4-rev5/parse-addendum";
import { parseAppendixDExtract } from "../src/framework/dod-cloud-il4-rev5/parse-appendix-d";
import { parseFedrampModerateWorkbook } from "../src/framework/dod-cloud-il4-rev5/parse-fedramp-moderate";
import {
  ADDENDUM_EXTRACT_VENDOR_FILE,
  ADDENDUM_WORKBOOK_SHA256,
  APPENDIX_D_EXTRACT_VENDOR_FILE,
  FEDRAMP_BASELINE_VENDOR_FILE,
  NIST_CATALOG_VENDOR_FILE,
  NIST_MODERATE_PROFILE_VENDOR_FILE,
} from "../src/framework/dod-cloud-il4-rev5/sources";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function maybeRegenerateAddendumExtract(): void {
  if (process.env.DOD_IL4_REGENERATE_ADDENDUM_EXTRACT !== "1") {
    return;
  }
  const candidates = [
    process.env.DOD_IL4_ADDENDUM_XLSX,
    path.join(
      repoRoot,
      "vendor/dod/cloud-il4-rev5/local/rev5_ssp_addendum_controls.xlsx",
    ),
    path.join(process.env.HOME ?? "", "Downloads/rev5_ssp_addendum_controls.xlsx"),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }
    const buffer = readFileSync(candidate);
    const extract = extractAddendumIl4Moderate(buffer);
    const outputPath = path.join(repoRoot, ADDENDUM_EXTRACT_VENDOR_FILE);
    writeFileSync(outputPath, `${JSON.stringify(extract, null, 2)}\n`, "utf8");
    console.log(
      `Regenerated Addendum extract from ${candidate} (sha256 ${ADDENDUM_WORKBOOK_SHA256}).`,
    );
    return;
  }
}

function main(): void {
  maybeRegenerateAddendumExtract();

  const fedrampBuffer = readFileSync(path.join(repoRoot, FEDRAMP_BASELINE_VENDOR_FILE));
  const fedramp = parseFedrampModerateWorkbook(fedrampBuffer);
  const addendum = parseAddendumExtract(readJson(ADDENDUM_EXTRACT_VENDOR_FILE));
  const appendixDNotes = parseAppendixDExtract(readJson(APPENDIX_D_EXTRACT_VENDOR_FILE));
  const catalogRoot = readJson(NIST_CATALOG_VENDOR_FILE);
  const nistModerateIds = nistProfileSelectedIds(
    readJson(NIST_MODERATE_PROFILE_VENDOR_FILE),
  );

  const result = deriveDodCloudIl4Framework({
    catalogRoot,
    nistModerateIds,
    fedrampRows: fedramp.rows,
    addendum,
    appendixDNotes,
    fedrampSha256: fedramp.sha256,
  });
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }

  const outputDir = path.join(repoRoot, "src/data/framework/generated");
  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, DOD_CLOUD_IL4_GENERATED_JSON_FILE);
  writeFileSync(outputPath, `${JSON.stringify(result.artifact, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${IL4_TOTAL_COUNT} DoD IL4 overlay items to ${path.relative(repoRoot, outputPath)} ` +
      `(${result.artifact.counts.nistBase} NIST base, ${result.artifact.counts.nistEnhancements} enhancements, ${result.artifact.counts.grr} GRR).`,
  );
}

main();
